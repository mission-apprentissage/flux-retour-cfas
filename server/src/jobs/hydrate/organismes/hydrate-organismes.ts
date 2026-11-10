import type { IOrganisme as IApiOrganisme } from "api-alternance-sdk";
import { ObjectId, type AnyBulkWriteOperation } from "mongodb";
import {
  NATURE_ORGANISME_DE_FORMATION,
  STATUT_FIABILISATION_ORGANISME,
  STATUT_PRESENCE_REFERENTIEL,
  type IDepartmentCode,
  type IOrganisme,
} from "shared";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { getEtablissementRechercheEntreprises } from "@/common/apis/apiRechercheEntreprises";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";
import { findDataByDepartementNum, getDepartementCodeFromCodeInsee } from "@/common/utils/adresseUtils";

type IAdresseOrganisme = NonNullable<IOrganisme["adresse"]>;

export type IRepliAdresse = {
  sourceDisponible: boolean;
  nbConservees: number;
  nbCompletees: number;
  nbSansAdresse: number;
};

export const nouveauRepliAdresse = (): IRepliAdresse => ({
  sourceDisponible: true,
  nbConservees: 0,
  nbCompletees: 0,
  nbSansAdresse: 0,
});

export const hydrateOrganismesFromApiAlternance = async (startTime: Date) => {
  let nbOrganismeCreated = 0;
  let nbOrganismeUpdated = 0;

  const repli = nouveauRepliAdresse();

  const cursor = apiAlternanceClient.organisme.export({ page_size: 100 });
  for await (const page of cursor) {
    const adressesDeRepli = await getAdressesDeRepli(page, repli);
    const operations = page
      .map((o) => generateBulkOperation(o, startTime, adressesDeRepli))
      .filter((op): op is AnyBulkWriteOperation<IOrganisme> => op !== null);

    if (operations.length > 0) {
      const result = await organismesDb().bulkWrite(operations);

      nbOrganismeCreated += result.insertedCount + result.upsertedCount;
      nbOrganismeUpdated += result.modifiedCount;
    }
  }

  // On reset tous les organismes comme non présents dans le référentiel
  let nbOrganismesSuppr = await resetOrganismesReferentielPresence(startTime);

  // Log & stats
  logger.info(`--> ${nbOrganismeCreated} organismes créés depuis le référentiel`);
  logger.info(`---> ${nbOrganismeUpdated} organismes mis à jour`);
  logger.info(`----> ${nbOrganismesSuppr} organismes supprimés de l'API`);
  logger.info(
    `-----> adresses absentes de l'API : ${repli.nbConservees} conservées, ${repli.nbCompletees} complétées via API Recherche d'entreprises, ${repli.nbSansAdresse} sans adresse`
  );

  return {
    nbOrganismesCrees: nbOrganismeCreated,
    nbOrganismesMaj: nbOrganismeUpdated,
    nbOrganismesSuppr,
    nbAdressesConservees: repli.nbConservees,
    nbAdressesCompletees: repli.nbCompletees,
    nbOrganismesSansAdresse: repli.nbSansAdresse,
  };
};

const cleOrganisme = (uai: string, siret: string) => `${uai}|${siret}`;

const getAdressesDeRepli = async (
  page: IApiOrganisme[],
  repli: IRepliAdresse
): Promise<Map<string, IAdresseOrganisme>> => {
  const adresses = new Map<string, IAdresseOrganisme>();
  const identifiants = page
    .filter((o) => o.etablissement.adresse === null)
    .flatMap(({ identifiant: { uai, siret } }) => (uai ? [{ uai, siret }] : []));
  if (identifiants.length === 0) {
    return adresses;
  }

  const existants = await organismesDb()
    .find({ $or: identifiants }, { projection: { uai: 1, siret: 1, adresse: 1 } })
    .toArray();
  for (const { uai, siret, adresse } of existants) {
    if (uai && adresse?.departement) {
      adresses.set(cleOrganisme(uai, siret), adresse);
    }
  }

  for (const { uai, siret } of identifiants) {
    const cle = cleOrganisme(uai, siret);
    if (adresses.has(cle)) {
      repli.nbConservees++;
      continue;
    }
    const adresse = await getAdresseRechercheEntreprises(siret, repli);
    if (adresse) {
      adresses.set(cle, adresse);
      repli.nbCompletees++;
    } else {
      repli.nbSansAdresse++;
    }
  }

  return adresses;
};

export const getAdresseRechercheEntreprises = async (
  siret: string,
  repli: IRepliAdresse
): Promise<IAdresseOrganisme | null> => {
  if (!repli.sourceDisponible) {
    return null;
  }

  try {
    const etablissement = await getEtablissementRechercheEntreprises(siret);
    if (!etablissement?.commune || etablissement.statut_diffusion_etablissement !== "O") {
      return null;
    }
    const departement = getDepartementCodeFromCodeInsee(etablissement.commune);
    const { code_region, num_academie } = findDataByDepartementNum(departement as IDepartmentCode);
    if (!code_region || !num_academie) {
      return null;
    }
    return {
      ...(etablissement.code_postal && { code_postal: etablissement.code_postal }),
      code_insee: etablissement.commune,
      ...(etablissement.libelle_commune && { commune: etablissement.libelle_commune }),
      departement,
      region: code_region,
      academie: num_academie,
      complete: etablissement.adresse,
    };
  } catch (e) {
    repli.sourceDisponible = false;
    logger.warn({ err: e }, "API Recherche d'entreprises indisponible, adresses manquantes non complétées");
    return null;
  }
};

type DefaultField = "created_at" | "_id" | "nature" | "formations_count";

const generateBulkOperation = (
  organismeApi: IApiOrganisme,
  startTime: Date,
  adressesDeRepli: Map<string, IAdresseOrganisme>
): AnyBulkWriteOperation<IOrganisme> | null => {
  const { uai, siret } = organismeApi.identifiant;

  // On insère uniquement les organismes fiable (ayant un SIRET & UAI validé)
  if (!uai) {
    return null;
  }

  const { adresse } = organismeApi.etablissement;
  const adresseFormatted =
    adresse === null
      ? (adressesDeRepli.get(cleOrganisme(uai, siret)) ?? null)
      : {
          code_postal: adresse.code_postal,
          code_insee: adresse.commune.code_insee,
          commune: adresse.commune.nom,
          departement: adresse.departement.code_insee,
          region: adresse.region.code_insee,
          academie: adresse.academie.code,
          complete: `${adresse.label} ${adresse.code_postal} ${adresse.commune.nom}`,
        };

  const defaultFields: Pick<IOrganisme, DefaultField> = {
    _id: new ObjectId(),
    created_at: startTime,
    nature: NATURE_ORGANISME_DE_FORMATION.INCONNUE,
    formations_count: 0,
  };

  const update: Omit<IOrganisme, DefaultField> = {
    uai,
    siret,
    nom: organismeApi.etablissement.enseigne ?? organismeApi.unite_legale.raison_sociale,
    raison_sociale: organismeApi.unite_legale.raison_sociale,
    enseigne: organismeApi.etablissement.enseigne,
    adresse: adresseFormatted,
    geopoint: organismeApi.etablissement.geopoint,
    ferme: !organismeApi.etablissement.ouvert,
    qualiopi: organismeApi.renseignements_specifiques.qualiopi,
    fiabilisation_statut:
      organismeApi.statut.referentiel === "présent"
        ? STATUT_FIABILISATION_ORGANISME.FIABLE
        : STATUT_FIABILISATION_ORGANISME.NON_FIABLE,
    est_dans_le_referentiel:
      organismeApi.statut.referentiel === "présent"
        ? STATUT_PRESENCE_REFERENTIEL.PRESENT
        : STATUT_PRESENCE_REFERENTIEL.ABSENT,
    updated_at: startTime,
    contacts_from_referentiel: organismeApi.contacts,
  };

  return {
    updateOne: {
      filter: { uai, siret },
      update: {
        $set: update,
        $setOnInsert: defaultFields,
      },
      upsert: organismeApi.statut.referentiel === "présent",
    },
  };
};

/**
 * Reset du flag est_dans_le_referentiel pour tous les organismes
 */
const resetOrganismesReferentielPresence = async (startTime: Date): Promise<number> => {
  logger.info("Remise à 0 des organismes comme non présents dans le référentiel...");
  const { modifiedCount } = await organismesDb().updateMany(
    {
      updated_at: { $ne: startTime },
      $or: [
        { est_dans_le_referentiel: { $ne: STATUT_PRESENCE_REFERENTIEL.ABSENT } },
        { fiabilisation_statut: { $ne: STATUT_FIABILISATION_ORGANISME.NON_FIABLE } },
      ],
    },
    {
      $set: {
        est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABLE,
        updated_at: startTime,
      },
    }
  );
  return modifiedCount;
};
