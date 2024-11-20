import { normalize } from "path";

import { captureException } from "@sentry/node";
import { MongoClient, ObjectId, WithoutId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { IEffectif, IOrganisme } from "shared/models";
import { IAirbyteRawBalDeca } from "shared/models/data/airbyteRawBalDeca.model";
import { zApprenant } from "shared/models/data/effectifs/apprenant.part";
import { zContrat } from "shared/models/data/effectifs/contrat.part";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { zodOpenApi } from "shared/models/zodOpenApi";
import { cyrb53Hash, getYearFromDate } from "shared/utils";

import { addComputedFields } from "@/common/actions/effectifs.actions";
import { checkIfEffectifExists } from "@/common/actions/engine/engine.actions";
import { getOrganismeByUAIAndSIRET } from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import { effectifsDECADb, organismesDb } from "@/common/model/collections";
import { getMongodbUri } from "@/common/mongodb";
import config from "@/config";

const logger = parentLogger.child({ module: "job:hydrate:contrats-deca-raw" });

const client = new MongoClient(getMongodbUri(config.mongodb.decaDbName, true));

export async function hydrateDecaRaw() {
  let count = { created: 0, updated: 0 };
  let totalCount = 0;
  const organismeIds = new Set<string>();

  try {
    await client.connect();

    const query = {
      "_airbyte_data.dispositif": "APPR",
      "_airbyte_data.organisme_formation.uai_cfa": { $exists: true },
      "_airbyte_data.organisme_formation.siret": { $exists: true },
      "_airbyte_data.formation.date_debut_formation": { $exists: true },
      "_airbyte_data.formation.date_fin_formation": { $exists: true },
    };

    const cursor = client.db().collection<IAirbyteRawBalDeca>(config.mongodb.decaDbCollection).find(query);

    for await (const document of cursor) {
      totalCount++;
      try {
        count = await updateEffectifDeca(document, count, organismeIds);
      } catch (docError) {
        logger.error(`Error updating document ${document._id}: ${docError}`);
        captureException(docError);
      }
    }

    if (totalCount > 0) {
      await updateOrganismesLastEffectifUpdate(organismeIds);
    } else {
      logger.error("No documents found matching the criteria.");
    }
  } catch (err) {
    logger.error(`Échec de la mise à jour des effectifs: ${err}`);
    captureException(err);
  } finally {
    logger.info(
      `Mise à jour des effectifs deca terminée. Sur ${totalCount}, ${count.created} créés, ${count.updated} mis à jour.`
    );
  }
}

async function updateEffectifDeca(
  document: IAirbyteRawBalDeca,
  count: { created: number; updated: number },
  organismeIds: Set<string>
) {
  const newDocuments: WithoutId<IEffectifDECA>[] = await transformDocument(document);

  for (const newDocument of newDocuments) {
    const effectifFound = await checkIfEffectifExists(newDocument, effectifsDECADb());

    if (!effectifFound) {
      await effectifsDECADb().insertOne(newDocument as IEffectifDECA);
      count.created++;
    } else {
      await effectifsDECADb().updateOne({ _id: effectifFound._id }, { $set: newDocument });
      count.updated++;
    }

    organismeIds.add(newDocument.organisme_id.toString());
  }

  return count;
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

async function transformDocument(document: IAirbyteRawBalDeca): Promise<WithoutId<IEffectifDECA>[]> {
  const { formation } = document._airbyte_data;

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
    effectifs.push(await createEffectif(document, anneeScolaire));
  } else {
    for (let year = startYear; year < endYear; year++) {
      const anneeScolaire = `${year}-${year + 1}`;
      effectifs.push(await createEffectif(document, anneeScolaire));
    }
  }

  return effectifs;
}

async function createEffectif(document: IAirbyteRawBalDeca, anneeScolaire: string): Promise<WithoutId<IEffectifDECA>> {
  const {
    alternant,
    formation,
    employeur,
    organisme_formation,
    date_debut_contrat,
    date_fin_contrat,
    date_effet_rupture,
    type_contrat,
  } = document._airbyte_data;

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

  const organisme: IOrganisme = await getOrganismeByUAIAndSIRET(uai_cfa, orgSiret);

  if (!organisme) {
    throw new Error("L'organisme n'a pas été trouvé dans la base de données.");
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

  const effectif: WithoutId<IEffectifDECA> = {
    deca_raw_id: document._id,
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
    id_erp_apprenant: cyrb53Hash(normalize(prenom || "").trim() + normalize(nom || "").trim() + (dateNaissance || "")),
    source: SOURCE_APPRENANT.DECA,
    annee_scolaire: anneeScolaire,
  };

  return {
    ...effectif,
    _computed: await addComputedFields({ organisme, effectif: effectif as WithoutId<IEffectif> }),
    is_deca_compatible: !organisme.is_transmission_target,
  };
}
