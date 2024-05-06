import { normalize } from "path";

import { captureException } from "@sentry/node";
import { ObjectId, WithoutId } from "mongodb";
import { IEffectif, IOrganisme } from "shared/models";
import { IDecaRaw } from "shared/models/data/decaRaw.model";
import { zApprenant } from "shared/models/data/effectifs/apprenant.part";
import { zContrat } from "shared/models/data/effectifs/contrat.part";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { zodOpenApi } from "shared/models/zodOpenApi";
import { cyrb53Hash, getYearFromDate } from "shared/utils";

import { addComputedFields } from "@/common/actions/effectifs.actions";
import { getOrganismeByUAIAndSIRET } from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import { decaRawDb, effectifsDECADb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";

const logger = parentLogger.child({ module: "job:hydrate:contrats-deca-raw" });

export async function hydrateDecaRaw() {
  let count = 0;

  try {
    await effectifsDECADb().drop();

    const cursor = decaRawDb().find({
      dispositif: "APPR",
      "organisme_formation.uai_cfa": { $exists: true },
      "organisme_formation.siret": { $exists: true },
      "formation.date_debut_formation": { $exists: true },
      "formation.date_fin_formation": { $exists: true },
    });

    for await (const document of cursor) {
      try {
        await updateEffectifDeca(document);
        count++;
      } catch (docError) {
        logger.error(`Error updating document ${document._id}: ${docError}`);
      }
    }

    if (count === 0) {
      console.log("No documents found matching the criteria.");
    }
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  } finally {
    logger.info(`Collection contratsDeca initialized successfully. Processed count: ${count}`);
  }
}

async function updateEffectifDeca(document: IDecaRaw) {
  const newDocument = await transformDocument(document);

  return await effectifsDECADb().insertOne(newDocument as IEffectifDECA);
}

async function transformDocument(document: IDecaRaw): Promise<WithoutId<IEffectifDECA>> {
  const {
    alternant,
    formation,
    employeur,
    organisme_formation,
    date_debut_contrat,
    date_fin_contrat,
    date_effet_rupture,
    type_contrat,
  } = document;
  const {
    nom,
    prenom,
    date_naissance,
    handicap,
    telephone,
    sexe,
    nationalite,
    courriel,
    adresse: adresseAlternant,
    derniere_classe,
  } = alternant;
  const { date_debut_formation, date_fin_formation, code_diplome, rncp, intitule_ou_qualification } = formation;
  const { siret, denomination, naf, adresse, nombre_de_salaries } = employeur;
  const { uai_cfa, siret: orgSiret } = organisme_formation;

  const startYear = getYearFromDate(date_debut_formation);
  const endYear = getYearFromDate(date_fin_formation);

  const organisme: IOrganisme = await getOrganismeByUAIAndSIRET(uai_cfa, orgSiret);

  if (!organisme) {
    throw new Error("L'organisme n'a pas été trouvé dans la base de données");
  }

  if (!startYear || !endYear) {
    throw new Error("L'année de début et l'année de fin doivent être définies");
  }

  if (!date_debut_contrat || !date_fin_contrat) {
    throw new Error("Les dates de début et de fin de contrat sont requises");
  }

  const effectif: IEffectifDECA = {
    _id: new ObjectId(),
    deca_raw_id: document._id,
    apprenant: {
      nom,
      prenom,
      date_de_naissance: date_naissance,
      nationalite: nationalite as zodOpenApi.TypeOf<typeof zApprenant>["nationalite"],
      historique_statut: [],
      has_nir: false,
      rqth: handicap,
      sexe: sexe === 1 ? "M" : sexe === 0 ? "F" : null,
      telephone,
      courriel,
      adresse: {
        numero: adresseAlternant.numero ? parseInt(adresseAlternant.numero, 10) : undefined,
        voie: adresseAlternant.voie,
        code_postal: adresseAlternant.code_postal,
      },
      situation_avant_contrat: derniere_classe as zodOpenApi.TypeOf<typeof zApprenant>["situation_avant_contrat"],
    },
    contrats: [
      {
        siret,
        denomination,
        type_employeur: parseInt(type_contrat, 10) as zodOpenApi.TypeOf<typeof zContrat>["type_employeur"],
        naf,
        adresse: { code_postal: adresse.code_postal },
        date_debut: date_debut_contrat,
        date_fin: date_fin_contrat,
        date_rupture: date_effet_rupture,
        nombre_de_salaries,
      },
    ],
    formation: {
      cfd: code_diplome,
      rncp,
      periode: [startYear, endYear],
      libelle_court: intitule_ou_qualification,
      libelle_long: intitule_ou_qualification,
      date_inscription: date_debut_formation,
      date_entree: date_debut_formation,
      date_fin: date_fin_formation,
    },
    organisme_id: organisme._id,
    organisme_responsable_id: organisme._id,
    organisme_formateur_id: organisme._id,
    validation_errors: [],
    created_at: new Date(),
    updated_at: new Date(),
    id_erp_apprenant: cyrb53Hash(normalize(prenom || "").trim() + normalize(nom || "").trim() + (date_naissance || "")),
    source: "DECA",
    annee_scolaire: startYear <= 2023 && endYear >= 2024 ? "2023-2024" : `${startYear}-${endYear}`,
  };

  return {
    ...effectif,
    _computed: addComputedFields({ organisme, effectif: effectif as IEffectif }),
    is_deca_compatible: !organisme.is_transmission_target,
  };
}
