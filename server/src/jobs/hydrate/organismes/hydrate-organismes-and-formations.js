import cliProgress from "cli-progress";
import logger from "../../../common/logger.js";
import { fetchOrganismes } from "../../../common/apis/apiReferentielMna.js";
import {
  createOrganisme,
  findOrganismeByUaiAndSiret,
  getOrganismeInfosFromSiret,
  updateOrganisme,
} from "../../../common/actions/organismes/organismes.actions.js";
import { buildAdresseFromUai } from "../../../common/utils/uaiUtils.js";
import { createJobEvent } from "../../../common/actions/jobEvents.actions.js";
import { buildTokenizedString } from "../../../common/utils/buildTokenizedString.js";
import { getFormationsTreeForOrganisme } from "../../../common/actions/organismes/organismes.formations.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const JOB_NAME = "hydrate-organismes-and-formations";

/**
 * Script qui initialise les organismes et les formations liées.
 * Pour le moment on n'optimise pas via un Promise.all avec appels en // car on a besoin de limiter les appels API Catalogue & Entreprise
 * et on a besoin temporairement de décompter les ajouts / update pour suivre la fiab.
 * 1. On va créer tous les organismes "stock" non présents dans le tdb mais existants dans le référentiel
 * sur la base du couple UAI SIRET, en ajoutant l'arbre des formations récupéré depuis le catalogue.
 * 2. Pour les organismes déja présents va MAJ le champ nature et l'arbre des formations
 * En cas d'erreurs on log via un createJobEvent()
 * TODO : Que fait-on des organismes qui sont dans le TDB mais ne sont pas dans le référentiel ? TODO faire un script spécifique pour identif ?
 */
export const hydrateOrganismesAndFormations = async () => {
  // On récupère l'intégralité des organismes depuis le référentiel
  let { organismes } = await fetchOrganismes();

  let nbOrganismeCreated = 0;
  let nbOrganismeNotCreated = 0;
  let nbFormationsCreated = 0;
  let nbFormationsNotCreated = 0;
  let nbOrganismeWithoutUaiOrSiret = 0;
  let nbOrganismeUpdated = 0;
  let nbOrganismeNotUpdated = 0;

  logger.info(`Traitement de ${organismes.length} organismes provenant du référentiel...`);
  loadingBar.start(organismes.length, 0);

  for (const organismeReferentiel of organismes) {
    const { uai, siret, raison_sociale, nature } = organismeReferentiel;

    // Si aucun UAI ou siret on ne peut pas effectuer de traitement
    if (!uai || !siret) {
      // TODO voir coté métier comment gérer la récupération d'organismes sans uai ou siret dans le référentiel
      nbOrganismeWithoutUaiOrSiret++;
      loadingBar.increment();
      continue;
    }

    // Recherche de l'organisme via le couple UAI - SIRET
    const organismeInTdb = await findOrganismeByUaiAndSiret(uai, siret);

    // Récupération de l'arbre des formations pour l'organisme
    const { formations, nbFormationsCreatedForOrganisme, nbFormationsNotCreatedForOrganisme } =
      await getFormationsTreeForOrganisme(uai);
    nbFormationsCreated += nbFormationsCreatedForOrganisme;
    nbFormationsNotCreated += nbFormationsNotCreatedForOrganisme;

    // Ajout de l'organisme si non existant dans le tdb
    if (!organismeInTdb) {
      try {
        await createOrganisme({
          uai,
          ...buildAdresseFromUai(uai),
          nature,
          siret,
          nom: raison_sociale,
          est_dans_le_referentiel: true,
          formations,
        });
        nbOrganismeCreated++;
      } catch (error) {
        nbOrganismeNotCreated++;
        await createJobEvent({
          jobname: JOB_NAME,
          date: new Date(),
          action: "organisme-not-created",
          data: { organisme: organismeReferentiel, error },
        });
      }
    } else {
      // Update de l'organisme si existant

      const { adresse, ferme, enseigne, raison_sociale, nom } = await getOrganismeInfosFromSiret(siret); // Récupération des infos depuis API Entreprise
      const updatedOrganisme = {
        ...organismeInTdb,
        ...(nom ? { nom: nom.trim(), nom_tokenized: buildTokenizedString(nom.trim(), 4) } : {}),
        ...(siret ? { siret } : {}),
        ...(adresse ? { adresse } : {}),
        ...(enseigne ? { enseigne } : {}),
        ...(raison_sociale ? { raison_sociale } : {}),
        ferme,
        nature: organismeReferentiel.nature,
        natureValidityWarning: false, // pas de warning car on a un match uai siret sur le référentiel
        est_dans_le_referentiel: true,
        formations,
      };
      try {
        await updateOrganisme(organismeInTdb._id, updatedOrganisme);
        nbOrganismeUpdated++;
      } catch (error) {
        nbOrganismeNotUpdated++;
        await createJobEvent({
          jobname: JOB_NAME,
          date: new Date(),
          action: "organisme-notUpdated",
          data: { organisme: updatedOrganisme, error },
        });
      }
    }

    loadingBar.increment();
  }

  loadingBar.stop();

  // Log & stats
  logger.info(
    `-> ${nbOrganismeWithoutUaiOrSiret} organismes sans UAI ou Siret dans le référentiel (pas de traitement)`
  );
  logger.info(
    `--> ${nbOrganismeCreated} organismes créés depuis le référentiel (avec ajout de l'arbre des formations)`
  );
  logger.info(`--> ${nbOrganismeNotCreated} organismes non créés depuis le référentiel (erreur)`);
  logger.info(`---> ${nbOrganismeUpdated} organismes mis à jour (nature + arbre des formations)`);
  logger.info(`---> ${nbOrganismeNotUpdated} organismes non mis à jour depuis le référentiel (erreur)`);
  logger.info(`---> ${nbFormationsCreated} formations crées via la création d'organismes`);
  logger.info(`---> ${nbFormationsNotCreated} formations non crées (erreurs) via la création d'organismes`);

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "finishing",
    data: {
      nbOrganismesSansUaiOuSiret: nbOrganismeWithoutUaiOrSiret,
      nbOrganismesCrees: nbOrganismeCreated,
      nbOrganismesNonCreesErreur: nbOrganismeNotCreated,
      nbOrganismesMaj: nbOrganismeUpdated,
      nbOrganismesNonMajErreur: nbOrganismeNotUpdated,
      nbFormationsCrees: nbFormationsCreated,
      nbFormationsNonCrees: nbFormationsNotCreated,
    },
  });
};
