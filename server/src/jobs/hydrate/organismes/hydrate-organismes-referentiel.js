import logger from "../../../common/logger.js";
import { fetchOrganismes } from "../../../common/apis/apiReferentielMna.js";
import { createJobEvent } from "../../../common/actions/jobEvents.actions.js";
import { organismesReferentielDb } from "../../../common/model/collections.js";

const JOB_NAME = "hydrate-organismes-referentiel";
let nbOrganismeCreated = 0;
let nbOrganismeNotCreated = 0;

/**
 * Script qui initialise les organismes du référentiel dans la collection organismesReferentiel
 */
export const hydrateOrganismesReferentiel = async () => {
  logger.info(`Clear des organismes du référentiel...`);
  await organismesReferentielDb().deleteMany({});

  // On récupère l'intégralité des organismes depuis le référentiel
  let { organismes } = await fetchOrganismes();
  logger.info(`Insertion de ${organismes.length} organismes provenant du référentiel...`);
  await Promise.all(
    organismes.map((currentOrganisme) => {
      return insertOrganismeReferentiel(currentOrganisme);
    })
  );

  // Log & stats
  logger.info(`--> ${nbOrganismeCreated} organismesReferentiel créés depuis le référentiel`);
  logger.info(`--> ${nbOrganismeNotCreated} organismesReferentiel non créés depuis le référentiel (erreur)`);

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "finishing",
    data: {
      nbOrganismesCrees: nbOrganismeCreated,
      nbOrganismesNonCreesErreur: nbOrganismeNotCreated,
    },
  });
};

/**
 * Fonction d'insertion d'un organismeReferentiel dans la collection
 * @param {*} organismeReferentiel
 */
const insertOrganismeReferentiel = async (organismeReferentiel) => {
  const {
    adresse,
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
  } = organismeReferentiel;

  // Ajout de l'organisme dans la collection
  try {
    await organismesReferentielDb().insertOne({
      ...(adresse ? { adresse } : {}),
      ...(enseigne ? { enseigne } : {}),
      ...(etat_administratif ? { etat_administratif } : {}),
      ...(forme_juridique ? { forme_juridique } : {}),
      ...(nature ? { nature } : {}),
      ...(numero_declaration_activite ? { numero_declaration_activite } : {}),
      ...(qualiopi ? { qualiopi } : {}),
      ...(raison_sociale ? { raison_sociale } : {}),
      ...(siret ? { siret } : {}),
      ...(siege_social ? { siege_social } : {}),
      ...(uai ? { uai } : {}),
    });
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
