import { captureException } from "@sentry/node";
import { PromisePool } from "@supercharge/promise-pool";
import Boom from "boom";
import { ObjectId } from "mongodb";
import { IOrganismeReferentiel } from "shared/models/data/organismesReferentiel.model";

import { fetchOrganismes } from "@/common/apis/apiReferentielMna";
import logger from "@/common/logger";
import { organismesReferentielDb } from "@/common/model/collections";

const JOB_NAME = "hydrate-organismes-referentiel";
let nbOrganismeCreated = 0;
let nbOrganismeNotCreated = 0;

/**
 * Script qui initialise les données du référentiel
 */
export const hydrateFromReferentiel = async () => {
  await hydrateOrganismesReferentiel();

  // Log & stats
  logger.info(`--> ${nbOrganismeCreated} organismesReferentiel créés depuis le référentiel`);
  logger.info(`--> ${nbOrganismeNotCreated} organismesReferentiel non créés depuis le référentiel (erreur)`);

  return {
    nbOrganismeCreated,
    nbOrganismeNotCreated,
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
      _id: new ObjectId(),
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
    } as IOrganismeReferentiel);
    nbOrganismeCreated++;
  } catch (error) {
    const err = Boom.internal("Erreur lors de la création de l'organisme-referentiel", {
      organismeReferentiel,
      jobname: JOB_NAME,
    });
    err.cause = error;
    captureException(err);
    nbOrganismeNotCreated++;
  }
};
