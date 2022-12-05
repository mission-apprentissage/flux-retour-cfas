import cliProgress from "cli-progress";
import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { getFormationsForOrganisme } from "../../../common/apis/apiCatalogueMna.js";
import { findOrganismeById, findOrganismeByUai, updateOrganisme } from "../../../common/actions/organismes.actions.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../../common/utils/validationsUtils/organisme-de-formation/nature.js";
import { getFormationWithCfd } from "../../../common/actions/formations.actions.js";
import { createJobEvent } from "../../../common/actions/jobEvents.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise les organismes
 * Va récupérer toutes les formations liés aux organismes via des dossiersApprenants présents en base
 * Sur chaque formation trouvée on va récupérer les infos de cette formation lié à cet organisme via le catalogue
 * et on en déduit la liste des organismes (avec leur nature) liés à cette formation pour cet organisme parent
 */
export const hydrateOrganismes = async () => {
  // Récupère tous les organismes id distinct dans les dossiersApprenants
  const allOrganismesId = await dossiersApprenantsMigrationDb().distinct("organisme_id");

  let nbOrganismesHandled = 0;
  let nbOrganismesWithoutFormations = 0;
  let nbFormationsAdded = 0;

  logger.info(allOrganismesId.length, "organismes id distincts dans les dossiersApprenants");
  loadingBar.start(allOrganismesId.length, 0);

  await asyncForEach(allOrganismesId, async (organisme_id) => {
    // Récupération de l'organisme
    const organisme = await findOrganismeById(organisme_id);

    // Récupération des formations liés à l'organisme
    const formationsForOrganisme = await getFormationsForOrganisme(organisme.uai);

    if (formationsForOrganisme.length > 0) {
      nbOrganismesHandled++;
      // Construction d'une liste de formations pour cet organisme
      let formationsForOrganismeArray = [];

      await asyncForEach(formationsForOrganisme, async (currentFormation) => {
        // Récupération de la formation du catalogue dans le TDB
        // TODO Que faire si la formation n'est pas dans le tdb ? on la créé ? on logge l'erreur ?
        const formationFromTdb = await getFormationWithCfd(currentFormation.cfd);

        // Ajout à la liste des formation de l'organisme d'un item contenant
        // formation_id si trouvé dans le tdb
        // année & durée trouvé dans le catalog
        // ainsi que la liste des organismes construite depuis l'API Catalogue
        formationsForOrganismeArray.push({
          ...(formationFromTdb ? { formation_id: formationFromTdb._id } : {}),
          annee_formation: parseInt(currentFormation.annee) || -1,
          duree_formation_theorique: parseInt(currentFormation.duree) || -1,
          organismes: await buildOrganismesListFromFormationFromCatalog(currentFormation),
        });
        nbFormationsAdded++;
      });

      // MAJ de l'organisme avec sa liste de formations
      await updateOrganisme(organisme_id, { formations: formationsForOrganismeArray });
      loadingBar.increment();
    } else {
      nbOrganismesWithoutFormations++;
      // Log & store cases
      await createJobEvent({
        jobname: "hydrate-organismes",
        date: new Date(),
        action: "organisme-withoutFormations",
        data: { organisme },
      });
    }
  });

  loadingBar.stop();

  // Log & stats
  logger.info(`-> ${nbOrganismesHandled} organismes traités (ayant des formations dans le catalogue).`);
  logger.info(`-> ${nbOrganismesWithoutFormations} organismes non traités (sans formations dans le catalogue).`);
  logger.info(`--> ${nbFormationsAdded} formations rattachées à des organismes.`);
};

/**
 * Méthode de construction de la liste des organismes avec leur nature, rattachés à une formation du catalogue
 * @param {*} formationCatalog
 * @returns
 */
const buildOrganismesListFromFormationFromCatalog = async (formationCatalog) => {
  let organismesLinkedToFormation = [];

  // Récupération du responsable (gestionnaire)
  if (formationCatalog.etablissement_gestionnaire_uai) {
    const organismeInTdb = await findOrganismeByUai(formationCatalog.etablissement_gestionnaire_uai);

    organismesLinkedToFormation.push({
      ...(organismeInTdb ? { organisme_id: organismeInTdb._id } : {}), // Si organisme trouvé dans le tdb
      ...(organismeInTdb ? { adresse: organismeInTdb.adresse } : {}), // Si organisme trouvé dans le tdb on son adresse
      nature: getNature(NATURE_ORGANISME_DE_FORMATION.RESPONSABLE, formationCatalog, organismesLinkedToFormation),
      uai: formationCatalog.etablissement_gestionnaire_uai,
      siret: formationCatalog.etablissement_gestionnaire_siret,
    });

    // TODO Voir ce qu'on fait si on ne trouve pas l'OF dans le tdb ? on le créé ? on logge l'anomalie ?
    // TODO Si pas d'organisme depuis le Tdb on récupère l'adresse from référentiel ?
  }

  // Gestion du formateur si nécessaire
  if (formationCatalog.etablissement_formateur_uai) {
    const organismeInTdb = await findOrganismeByUai(formationCatalog.etablissement_formateur_uai);

    organismesLinkedToFormation.push({
      ...(organismeInTdb ? { organisme_id: organismeInTdb._id } : {}), // Si organisme trouvé dans le tdb
      ...(organismeInTdb ? { adresse: organismeInTdb.adresse } : {}), // Si organisme trouvé dans le tdb on son adresse
      nature: getNature(NATURE_ORGANISME_DE_FORMATION.FORMATEUR, formationCatalog, organismesLinkedToFormation),
      uai: formationCatalog.etablissement_formateur_uai,
      siret: formationCatalog.etablissement_formateur_siret,
    });

    // TODO Voir ce qu'on fait si on ne trouve pas l'OF dans le tdb ? on le créé ? on logge l'anomalie ?
    // TODO Si pas d'organisme depuis le Tdb on récupère l'adresse from référentiel ?
  }

  // Gestion du lieu de formation
  // TODO WIP
  organismesLinkedToFormation.push({
    nature: NATURE_ORGANISME_DE_FORMATION.LIEU,
    // uai: formationCatalog.XXXX, // TODO non récupérée par RCO donc pas présent dans le catalogue (vu avec Quentin)
    ...(formationCatalog.lieu_formation_siret ? { siret: formationCatalog.lieu_formation_siret } : {}),
    // TODO On récupère l'adresse depuis le référentiel en appelant avec le siret ?
  });

  return organismesLinkedToFormation;
};

/**
 * Vérifie la nature, si on détecte un uai formateur = reponsable alors on est dans le cas d'un responsable_formateur
 * sinon on renvoi la nature default
 * @param {*} defaultNature
 * @param {*} formationCatalog
 * @param {*} organismesLinkedToFormation
 * @returns
 */
const getNature = (defaultNature, formationCatalog, organismesLinkedToFormation) => {
  // Vérification si OF a la fois identifié gestionnaire (responsable) & formateur
  const isResponsableEtFormateur =
    formationCatalog.etablissement_gestionnaire_uai === formationCatalog.etablissement_formateur_uai;

  // Vérification s'il n'est pas déja dans la liste
  const isNotAlreadyInOrganismesLinkedToFormation = !organismesLinkedToFormation.some(
    (item) => item.uai === formationCatalog.etablissement_gestionnaire_uai
  );

  return isResponsableEtFormateur && isNotAlreadyInOrganismesLinkedToFormation
    ? NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR
    : defaultNature;
};
