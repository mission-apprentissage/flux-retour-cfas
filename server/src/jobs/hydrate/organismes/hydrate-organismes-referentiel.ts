import { PromisePool } from "@supercharge/promise-pool";

import { createJobEvent } from "@/common/actions/jobEvents.actions";
import { fetchOrganismes, fetchUaisAcce } from "@/common/apis/apiReferentielMna";
import logger from "@/common/logger";
import { OrganismesReferentiel } from "@/common/model/@types/OrganismesReferentiel";
import { organismesReferentielDb, uaisAccesReferentielDb } from "@/common/model/collections";

const JOB_NAME = "hydrate-organismes-referentiel";
let nbOrganismeCreated = 0;
let nbOrganismeNotCreated = 0;
let nbUaiAcceCreated = 0;
let nbUaiAcceNotCreated = 0;

/**
 * Script qui initialise les données du référentiel
 */
export const hydrateFromReferentiel = async () => {
  await Promise.all([hydrateOrganismesReferentiel(), hydrateUaisAcceReferentiel()]);

  // Log & stats
  logger.info(`--> ${nbOrganismeCreated} organismesReferentiel créés depuis le référentiel`);
  logger.info(`--> ${nbOrganismeNotCreated} organismesReferentiel non créés depuis le référentiel (erreur)`);
  logger.info(`--> ${nbUaiAcceCreated} uais de la base ACCE créés depuis le référentiel`);
  logger.info(`--> ${nbUaiAcceNotCreated} uais de la base ACCE non créés depuis le référentiel (erreur)`);

  return {
    nbOrganismeCreated,
    nbOrganismeNotCreated,
    nbUaiAcceCreated,
    nbUaiAcceNotCreated,
  };
};

/**
 * Récupération des organismes du référentiel dans la collection organismesReferentiel
 */
const hydrateOrganismesReferentiel = async () => {
  logger.info("Clear des organismes du référentiel...");
  await organismesReferentielDb().deleteMany({});

  // On récupère l'intégralité des organismes depuis le référentiel
  const organismes = await fetchOrganismes();
  logger.info(`Insertion de ${organismes.length} organismes provenant du référentiel...`);
  await PromisePool.for(organismes).process(insertOrganismeReferentiel);
};

/**
 * Récupération des uais ACCE du référentiel dans la collection uaisAccesReferentiel
 */
const hydrateUaisAcceReferentiel = async () => {
  logger.info("Clear des uais ACCE du référentiel...");
  await uaisAccesReferentielDb().deleteMany({});

  // On récupère l'intégralité des uais ACCE depuis le référentiel
  let { uais } = await fetchUaisAcce();
  logger.info(`Insertion de ${uais.length} uais de la base ACCE provenant du référentiel...`);
  await PromisePool.for(uais).process(insertUaiAcceReferentiel);
};

/**
 * Fonction d'insertion d'un organismeReferentiel dans la collection
 * @param {*} organismeReferentiel
 */
const insertOrganismeReferentiel = async (organismeReferentiel) => {
  const {
    adresse,
    contacts,
    enseigne,
    etat_administratif,
    forme_juridique,
    nature,
    numero_declaration_activite,
    qualiopi,
    raison_sociale,
    siret,
    siege_social,
    uai,
    lieux_de_formation,
    relations,
  } = organismeReferentiel;
  // Ajout de l'organisme dans la collection
  try {
    await organismesReferentielDb().insertOne({
      ...(adresse ? { adresse } : {}),
      ...(contacts ? { contacts } : {}),
      ...(enseigne ? { enseigne } : {}),
      ...(etat_administratif ? { etat_administratif } : {}),
      ...(forme_juridique ? { forme_juridique } : {}),
      ...(nature ? { nature } : {}),
      ...(numero_declaration_activite ? { numero_declaration_activite } : {}),
      ...(qualiopi ? { qualiopi } : {}),
      ...(raison_sociale ? { raison_sociale } : {}),
      ...(siret ? { siret } : {}),
      ...(siege_social ? { siege_social } : {}),
      lieux_de_formation: lieux_de_formation || [],
      relations: relations || [],
      ...(uai ? { uai } : {}),
    } as OrganismesReferentiel);
    nbOrganismeCreated++;
  } catch (error) {
    nbOrganismeNotCreated++;
    await createJobEvent({
      jobname: JOB_NAME,
      date: new Date(),
      action: "organisme-not-created",
      data: { organismeReferentiel, error },
    });
  }
};

/**
 * Fonction d'insertion d'un uai de la base ACCE du référentiel dans la collection
 * @param {*} uaiAcceReferentiel
 */
const insertUaiAcceReferentiel = async (uaiAcceReferentiel) => {
  const { uai } = uaiAcceReferentiel;

  // Ajout de l'organisme dans la collection
  try {
    await uaisAccesReferentielDb().updateOne({ uai }, { $set: { uai } }, { upsert: true });
    nbUaiAcceCreated++;
  } catch (error) {
    nbUaiAcceNotCreated++;
    await createJobEvent({
      jobname: JOB_NAME,
      date: new Date(),
      action: "uai-not-created",
      data: { uaiAcceReferentiel, error },
    });
  }
};
