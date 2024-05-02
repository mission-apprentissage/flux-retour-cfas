import { normalize } from "path";

import { captureException } from "@sentry/node";
import { ObjectId, WithoutId } from "mongodb";
import { IOrganisme } from "shared/models";
import { IDecaRaw } from "shared/models/data/decaRaw.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
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
  } = document;
  const { nom, prenom, date_naissance } = alternant;
  const { date_debut_formation, date_fin_formation, code_diplome, rncp, intitule_ou_qualification } = formation;
  const { siret, denomination, naf, adresse } = employeur;
  const { uai_cfa, siret: orgSiret } = organisme_formation;

  const startYear = getYearFromDate(date_debut_formation);
  const endYear = getYearFromDate(date_fin_formation);

  const organisme: IOrganisme = await getOrganismeByUAIAndSIRET(uai_cfa, orgSiret);

  if (!organisme) {
    throw new Error("Start year and end year must be defined");
  }

  if (!startYear || !endYear) {
    throw new Error("Start year and end year must be defined");
  }

  if (!date_debut_contrat || !date_fin_contrat) {
    throw new Error("Contract start and end dates are required");
  }

  const effectif = {
    _id: new ObjectId(),
    apprenant: {
      nom,
      prenom,
      date_de_naissance: date_naissance,
      historique_statut: [],
      has_nir: false,
    },
    contrats: [
      {
        siret,
        denomination,
        type_employeur: null,
        naf,
        adresse: { code_postal: adresse.code_postal },
        date_debut: date_debut_contrat,
        date_fin: date_fin_contrat,
        date_rupture: date_effet_rupture,
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
    validation_errors: [],
    created_at: new Date(),
    updated_at: new Date(),
    id_erp_apprenant: cyrb53Hash(normalize(prenom || "").trim() + normalize(nom || "").trim() + (date_naissance || "")),
    source: "DECA",
    annee_scolaire: adjustDateRanges(startYear, endYear),
  };

  return {
    ...effectif,
    _computed: addComputedFields({ organisme, effectif }),
    is_deca_compatible: !organisme.is_transmission_target,
  };
}

function adjustDateRanges(startYear: number, endYear: number) {
  const targetEntryYear = 2023;
  const targetEndYear = 2024;

  return startYear === targetEntryYear ||
    endYear === targetEndYear ||
    (startYear < targetEntryYear && endYear > targetEndYear)
    ? `${targetEntryYear}-${targetEndYear}`
    : `${startYear}-${endYear}`;
}
