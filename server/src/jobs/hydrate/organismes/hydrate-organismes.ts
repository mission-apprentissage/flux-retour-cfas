import type { IOrganisme as IApiOrganisme } from "api-alternance-sdk";
import { ObjectId, type AnyBulkWriteOperation } from "mongodb";
import {
  NATURE_ORGANISME_DE_FORMATION,
  STATUT_FIABILISATION_ORGANISME,
  STATUT_PRESENCE_REFERENTIEL,
  type IOrganisme,
} from "shared";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

export const hydrateOrganismesFromApiAlternance = async (startTime: Date) => {
  let nbOrganismeCreated = 0;
  let nbOrganismeUpdated = 0;

  const cursor = apiAlternanceClient.organisme.export({ page_size: 100 });
  for await (const page of cursor) {
    const operations = page.map((o) => generateBulkOperation(o, startTime)).filter((op) => op !== null);

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

  return {
    nbOrganismesCrees: nbOrganismeCreated,
    nbOrganismesMaj: nbOrganismeUpdated,
    nbOrganismesSuppr,
  };
};

type DefaultField = "created_at" | "_id" | "nature";

const generateBulkOperation = (
  organismeApi: IApiOrganisme,
  startTime: Date
): AnyBulkWriteOperation<IOrganisme> | null => {
  const { uai, siret } = organismeApi.identifiant;

  // On insère uniquement les organismes fiable (ayant un SIRET & UAI validé)
  if (!uai) {
    return null;
  }

  const { adresse } = organismeApi.etablissement;
  const adresseFormatted =
    adresse === null
      ? null
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
  };

  const update: Omit<IOrganisme, DefaultField> = {
    uai,
    siret,
    nom: organismeApi.etablissement.enseigne ?? organismeApi.unite_legale.raison_sociale,
    raison_sociale: organismeApi.unite_legale.raison_sociale,
    enseigne: organismeApi.etablissement.enseigne,
    adresse: adresseFormatted,
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
