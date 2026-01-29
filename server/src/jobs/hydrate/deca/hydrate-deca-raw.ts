import { normalize } from "path";

import { captureException } from "@sentry/node";
import * as Sentry from "@sentry/node";
import { MongoClient, MongoError, ObjectId, WithoutId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { IRawBalDeca } from "shared/models/data/airbyteRawBalDeca.model";
import { zApprenant } from "shared/models/data/effectifs/apprenant.part";
import { zContrat } from "shared/models/data/effectifs/contrat.part";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { zodOpenApi } from "shared/models/zodOpenApi";
import { cyrb53Hash, getYearFromDate } from "shared/utils";

import { updateVoeuxAffelnetEffectifDeca } from "@/common/actions/affelnet.actions";
import { withComputedFields } from "@/common/actions/effectifs.actions";
import { checkIfEffectifExists, getAndFormatCommuneFromCode } from "@/common/actions/engine/engine.actions";
import { createMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import { getOrganismeByUAIAndSIRET } from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import { effectifsDECADb, organismesDb } from "@/common/model/collections";
import { getBALMongodbUri } from "@/common/mongodb";
import config from "@/config";
import {
  fiabilisationEffectifFormation,
  getEffectifCertification,
} from "@/jobs/fiabilisation/certification/fiabilisation-certification";

const logger = parentLogger.child({ module: "job:hydrate:contrats-deca-raw" });

const client = new MongoClient(getBALMongodbUri(config.mongodb.dbNameBal));

interface IProcessingStats {
  created: number;
  updated: number;
  organismesId: Set<string>;
}

function createEmptyStats(): IProcessingStats {
  return {
    created: 0,
    updated: 0,
    organismesId: new Set(),
  };
}

function mergeStats(target: IProcessingStats, source: IProcessingStats): void {
  target.created += source.created;
  target.updated += source.updated;
  for (const id of source.organismesId) {
    target.organismesId.add(id);
  }
}

export async function hydrateDecaRaw() {
  const totalStats = createEmptyStats();
  let totalCount = 0;

  const processBuffer = async (buffer: Promise<IProcessingStats>[]) => {
    const results = await Promise.allSettled(buffer);
    for (const result of results) {
      if (result.status === "fulfilled") {
        mergeStats(totalStats, result.value);
      }
    }
    totalCount += buffer.length;
  };

  try {
    await client.connect();

    const query = {
      dispositif: "APPR",
      "organisme_formation.uai_cfa": { $exists: true },
      "organisme_formation.siret": { $exists: true },
      "formation.date_debut_formation": { $exists: true },
      "formation.date_fin_formation": { $exists: true },
    };

    const cursor = client.db().collection<IRawBalDeca>(config.mongodb.decaDbCollectionBal).find(query);

    let promiseArray: Promise<IProcessingStats>[] = [];
    for await (const document of cursor) {
      promiseArray.push(updateEffectifDeca(document));

      if (promiseArray.length === 100) {
        await processBuffer(promiseArray);
        promiseArray = [];
      }
    }

    if (promiseArray.length > 0) {
      await processBuffer(promiseArray);
    }

    if (totalCount > 0) {
      await updateOrganismesLastEffectifUpdate(totalStats.organismesId);
    } else {
      logger.error("No documents found matching the criteria.");
    }
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  } finally {
    await client.close();
    logger.info(`DECA terminé: ${totalCount} traités, ${totalStats.created} créés, ${totalStats.updated} mis à jour`);
  }
}

export async function hydrateDecaFromExistingEffectifs() {
  let mlUpserted = 0;
  let totalProcessed = 0;

  const DECA_RUPTURE_DATE_DEBUT = new Date("2025-11-01");
  const DECA_RUPTURE_DATE_FIN = new Date("2026-02-28");

  logger.info(
    `DECA→ML one-shot: période ${DECA_RUPTURE_DATE_DEBUT.toISOString().split("T")[0]} - ${DECA_RUPTURE_DATE_FIN.toISOString().split("T")[0]}`
  );

  try {
    const cursor = effectifsDECADb().find({
      "contrats.date_rupture": { $gte: DECA_RUPTURE_DATE_DEBUT, $lte: DECA_RUPTURE_DATE_FIN },
    });

    for await (const effectif of cursor) {
      const mlResult = await createMissionLocaleSnapshot(effectif);
      if (mlResult?.upserted) mlUpserted++;
      totalProcessed++;

      if (totalProcessed % 1000 === 0) {
        logger.info(`DECA→ML: ${totalProcessed} traités, ${mlUpserted} ajoutés`);
      }
    }
  } catch (err) {
    logger.error(`Échec du traitement: ${err}`);
    captureException(err);
  } finally {
    logger.info(`DECA→ML terminé: ${totalProcessed} analysés, ${mlUpserted} ajoutés`);
  }
}

async function upsertEffectifDeca(
  effectif: WithoutId<IEffectifDECA>,
  retry: boolean = true
): Promise<{ created: boolean }> {
  const effectifFound = await checkIfEffectifExists<IEffectifDECA>(effectif, effectifsDECADb());

  if (!effectifFound) {
    try {
      const id = new ObjectId();
      await effectifsDECADb().insertOne({ ...effectif, _id: id });
      await updateVoeuxAffelnetEffectifDeca(id, effectif, effectif.organisme_formateur_id?.toString());
      await createMissionLocaleSnapshot({ ...effectif, _id: id });
      return { created: true };
    } catch (err) {
      // Le code d'erreur 11000 correspond à une duplication d'index unique
      // Ce cas arrive lors du traitement concurrentiel du meme effectif dans la queue
      if (retry && err instanceof MongoError && err.code === 11000) {
        return upsertEffectifDeca(effectif, false);
      }
      throw err;
    }
  }

  const transmitted_at = new Date();
  await effectifsDECADb().updateOne({ _id: effectifFound._id }, { $set: { ...effectif, transmitted_at } });
  await createMissionLocaleSnapshot({ ...effectif, _id: effectifFound._id, transmitted_at });
  return { created: false };
}

async function updateEffectifDeca(document: IRawBalDeca): Promise<IProcessingStats> {
  return Sentry.startSpan(
    {
      name: "DECA Update Effectif",
      op: "deca.item",
      forceTransaction: true,
    },
    async () => {
      const stats = createEmptyStats();
      const newDocuments: WithoutId<IEffectifDECA>[] = await transformDocument(document);

      for (const newDocument of newDocuments) {
        const result = await upsertEffectifDeca(newDocument);

        if (result.created) {
          stats.created++;
        } else {
          stats.updated++;
        }

        stats.organismesId.add(newDocument.organisme_id.toString());
      }

      return stats;
    }
  );
}

async function updateOrganismesLastEffectifUpdate(organismeIds: Set<string>) {
  const currentTimestamp = new Date();

  try {
    const bulkOperations = Array.from(organismeIds).map((organismeId) => ({
      updateOne: {
        filter: { _id: new ObjectId(organismeId) },
        update: { $set: { last_effectifs_deca_update: currentTimestamp } },
      },
    }));

    if (bulkOperations.length > 0) {
      await organismesDb().bulkWrite(bulkOperations);
      logger.info(`Mise à jour réussie de ${bulkOperations.length} organismes avec last_effectifs_deca_update.`);
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors de la mise à jour de last_effectifs_deca_update pour les organismes :", error.message);
    } else {
      logger.error("Erreur lors de la mise à jour de last_effectifs_deca_update pour les organismes :", error);
    }
  }
}

async function transformDocument(document: IRawBalDeca): Promise<WithoutId<IEffectifDECA>[]> {
  const { formation } = document;

  const dateDebutFormation = formation?.date_debut_formation ? new Date(formation.date_debut_formation) : null;
  const dateFinFormation = formation?.date_fin_formation ? new Date(formation.date_fin_formation) : null;

  const startYear = dateDebutFormation ? getYearFromDate(dateDebutFormation) : null;
  const endYear = dateFinFormation ? getYearFromDate(dateFinFormation) : null;

  if (!startYear || !endYear || startYear > endYear || endYear - startYear > 5) {
    throw new Error(
      `Les dates de début et de fin de formation sont incorrectes. Document ID: ${document._id}, ` +
        `date de début de formation: ${dateDebutFormation}, date de fin de formation: ${dateFinFormation} `
    );
  }

  const effectifs: WithoutId<IEffectifDECA>[] = [];

  if (startYear === endYear) {
    const anneeScolaire = `${startYear}-${startYear}`;
    const effectif = await createEffectif(document, anneeScolaire);
    if (effectif) {
      effectifs.push(effectif);
    }
  } else {
    for (let year = startYear; year < endYear; year++) {
      const anneeScolaire = `${year}-${year + 1}`;
      const effectif = await createEffectif(document, anneeScolaire);
      if (effectif) {
        effectifs.push(effectif);
      }
    }
  }

  return effectifs;
}

async function createEffectif(document: IRawBalDeca, anneeScolaire: string): Promise<WithoutId<IEffectifDECA> | null> {
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

  const organisme = await getOrganismeByUAIAndSIRET(uai_cfa, orgSiret);

  if (!organisme) {
    return null;
  }

  const currentTimestamp = new Date();
  await effectifsDECADb().updateOne({ _id: organisme._id }, { $set: { last_effectifs_deca_update: currentTimestamp } });

  const dateDebutContrat = date_debut_contrat ? new Date(date_debut_contrat) : null;
  const dateFinContrat = date_fin_contrat ? new Date(date_fin_contrat) : null;
  const dateEffetRupture = date_effet_rupture ? new Date(date_effet_rupture) : null;

  const dateDebutFormation = date_debut_formation ? new Date(date_debut_formation) : null;
  const dateFinFormation = date_fin_formation ? new Date(date_fin_formation) : null;

  const dateNaissance = date_naissance ? new Date(date_naissance) : null;

  if (!dateDebutContrat || !dateFinContrat) {
    throw new Error("Les dates de début et de fin de contrat sont requises.");
  }

  const startYear = getYearFromDate(dateDebutFormation);
  const endYear = getYearFromDate(dateFinFormation);

  if (!startYear || !endYear) {
    throw new Error("L'année de début et l'année de fin doivent être définies");
  }

  if (adresseAlternant.code_postal.length !== 5) {
    logger.warn(
      `Le code postal de l'alternant est invalide. Document ID: ${document._id}, code postal: ${adresseAlternant.code_postal}`
    );
    return null;
  }

  const commune = await getAndFormatCommuneFromCode(null, adresseAlternant.code_postal);

  const effectif: WithoutId<IEffectifDECA> = {
    deca_raw_id: new ObjectId(document._id),
    apprenant: {
      nom,
      prenom,
      date_de_naissance: dateNaissance,
      nationalite: nationalite as zodOpenApi.TypeOf<typeof zApprenant>["nationalite"],
      historique_statut: [],
      has_nir: false,
      rqth: handicap,
      sexe: sexe === "H" ? "M" : sexe === "F" ? "F" : null,
      telephone,
      courriel,
      adresse: {
        numero: adresseAlternant.numero ? parseInt(adresseAlternant.numero, 10) : undefined,
        voie: adresseAlternant.voie,
        code_postal: adresseAlternant.code_postal,
        ...commune,
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
        date_debut: dateDebutContrat,
        date_fin: dateFinContrat,
        date_rupture: dateEffetRupture,
        nombre_de_salaries,
      },
    ],
    formation: {
      cfd: code_diplome,
      rncp,
      periode: [startYear, endYear],
      libelle_court: intitule_ou_qualification,
      libelle_long: intitule_ou_qualification,
      date_inscription: dateDebutFormation,
      date_entree: dateDebutFormation,
      date_fin: dateFinFormation,
    },
    organisme_id: organisme._id,
    organisme_responsable_id: organisme._id,
    organisme_formateur_id: organisme._id,
    validation_errors: [],
    created_at: new Date(),
    updated_at: new Date(),
    transmitted_at: new Date(),
    id_erp_apprenant: cyrb53Hash(normalize(prenom || "").trim() + normalize(nom || "").trim() + (dateNaissance || "")),
    source: SOURCE_APPRENANT.DECA,
    annee_scolaire: anneeScolaire,
  };

  const certification = await getEffectifCertification({
    cfd: effectif?.formation?.cfd,
    rncp: effectif?.formation?.rncp,
    date_entree: dateDebutFormation,
    date_fin: dateFinFormation,
  });

  const computedFormation = await fiabilisationEffectifFormation(effectif, certification);

  return withComputedFields(
    {
      ...effectif,
      formation: computedFormation,
      is_deca_compatible: !organisme.is_transmission_target,
    },
    { organisme, certification }
  );
}
