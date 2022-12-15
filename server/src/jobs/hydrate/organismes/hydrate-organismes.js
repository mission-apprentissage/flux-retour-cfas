import cliProgress from "cli-progress";
import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { fetchOrganismes } from "../../../common/apis/apiReferentielMna.js";
import { createOrganisme, findOrganismeByUai, updateOrganisme } from "../../../common/actions/organismes.actions.js";
import { buildAdresseFromUai } from "../../../common/utils/uaiUtils.js";
import { createJobEvent } from "../../../common/actions/jobEvents.actions.js";
import { getCatalogFormationsForOrganisme } from "../../../common/apis/apiCatalogueMna.js";
import { getFormationWithCfd } from "../../../common/actions/formations.actions.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../../common/utils/validationsUtils/organisme-de-formation/nature.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Liste des champs à récupérer depuis le référentiel
 */
const REFERENTIEL_FIELDS_TO_FETCH = [
  "siret",
  "uai",
  "etat_administratif",
  "qualiopi",
  "raison_sociale",
  "enseigne",
  "nature",
  "qualiopi",
  "adresse",
  "numero_declaration_activite",
];

/**
 * Script qui initialise les organismes
 * 1. On va créer tous les organismes "stock" non présents dans le tdb mais existants dans le référentiel
 * sur la base de l'UAI, en ajoutant l'arbre des formations récupéré depuis le catalogue.
 * 2. Pour les organismes déja présents va MAJ le champ nature et l'arbre des formations
 * TODO : Que fait-on des organismes qui sont dans le TDB mais ne sont pas dans le référentiel ? TODO faire un script spécifique pour identif ?
 */
export const hydrateOrganismes = async () => {
  // Fetch organismes from referentiel api
  const { organismes } = await fetchOrganismes({
    champs: REFERENTIEL_FIELDS_TO_FETCH.join(","),
    itemsPerPage: 10000,
  });

  let nbOrganismeCreated = 0;
  let nbOrganismeNotCreated = 0;
  let nbOrganismeWithoutUai = 0;
  let nbOrganismeUpdated = 0;
  let nbOrganismeNotUpdated = 0;

  logger.info(`Traitement de ${organismes.length} organismes provenant du référentiel...`);
  loadingBar.start(organismes.length, 0);

  await asyncForEach(organismes, async (organismeReferentiel) => {
    const { uai, siret, raison_sociale, nature } = organismeReferentiel;

    // Si aucun uai on ne peut pas effectuer de traitement
    if (!uai) {
      // TODO voir coté métier comment gérer la récupération d'organismes sans uai dans le référentiel
      nbOrganismeWithoutUai++;
      // Log & store
      await createJobEvent({
        jobname: "hydrate-referentiel",
        date: new Date(),
        action: "no-uai-for-organisme-in-referentiel",
        data: { organisme: organismeReferentiel },
      });
    } else {
      const organisme = await findOrganismeByUai(uai);
      const formations = await getFormationsTreeForOrganisme(organismeReferentiel);

      // Ajout de l'organisme si non existant dans le tdb
      if (!organisme) {
        try {
          await createOrganisme({
            uai,
            ...buildAdresseFromUai(uai),
            nature,
            siret,
            sirets: [siret],
            nom: raison_sociale,
            est_dans_le_referentiel: true,
            formations,
          });
          nbOrganismeCreated++;

          // Log & store
          await createJobEvent({
            jobname: "hydrate-referentiel",
            date: new Date(),
            action: "organisme-created",
            data: { organisme: organismeReferentiel },
          });
        } catch (error) {
          nbOrganismeNotCreated++;
          // Log & store error
          await createJobEvent({
            jobname: "hydrate-referentiel",
            date: new Date(),
            action: "organisme-not-created",
            data: { organisme: organismeReferentiel, error },
          });
        }
      } else {
        // Update de l'organisme si existant
        // Set de la nature et un flag natureValidityWarning = perfectMatch
        // Set de l'arbre des formations
        const perfectUaiSiretMatch =
          organisme.sirets.length === 1 && organisme.sirets[0] === organismeReferentiel.siret;
        const updatedOrganisme = {
          ...organisme,
          nature: organismeReferentiel.nature,
          natureValidityWarning: !perfectUaiSiretMatch,
          est_dans_le_referentiel: true,
          formations,
        };
        try {
          await updateOrganisme(organisme._id, updatedOrganisme);
          nbOrganismeUpdated++;

          // Log & store
          await createJobEvent({
            jobname: "hydrate-referentiel",
            date: new Date(),
            action: "organisme-updated",
            data: { organisme: updatedOrganisme },
          });
        } catch (error) {
          nbOrganismeNotUpdated++;
          // Log & store errors
          await createJobEvent({
            jobname: "hydrate-referentiel",
            date: new Date(),
            action: "organisme-notUpdated",
            data: { organisme: updatedOrganisme, error },
          });
        }
      }
    }

    loadingBar.increment();
  });

  loadingBar.stop();

  // Log & stats
  logger.info(`-> ${nbOrganismeWithoutUai} organismes sans UAI dans le référentiel (pas de traitement)`);
  logger.info(
    `--> ${nbOrganismeCreated} organismes créés depuis le référentiel (avec ajout de l'arbre des formations)`
  );
  logger.info(`--> ${nbOrganismeNotCreated} organismes non créés depuis le référentiel (erreur)`);
  logger.info(`---> ${nbOrganismeUpdated} organismes mis à jour (nature + arbre des formations)`);
  logger.info(`---> ${nbOrganismeNotUpdated} organismes non mis à jour depuis le référentiel (erreur)`);
};

/**
 * Méthode de récupération de l'arbre des formations issues du catalogue liées à un organisme
 * @param {*} uai
 */
export const getFormationsTreeForOrganisme = async (organisme) => {
  // Récupération des formations liés à l'organisme
  const catalogFormationsForOrganisme = await getCatalogFormationsForOrganisme(organisme.uai);

  // Construction d'une liste de formations pour cet organisme
  let formationsForOrganismeArray = [];

  if (catalogFormationsForOrganisme.length > 0) {
    await asyncForEach(catalogFormationsForOrganisme, async (currentFormation) => {
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
    });
  } else {
    // Log & store cases
    await createJobEvent({
      jobname: "hydrate-organismes",
      date: new Date(),
      action: "organisme-withoutFormations",
      data: { organisme },
    });
  }

  return formationsForOrganismeArray;
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
 * Vérifie la nature, si on détecte un uai formateur = responsable alors on est dans le cas d'un responsable_formateur
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
