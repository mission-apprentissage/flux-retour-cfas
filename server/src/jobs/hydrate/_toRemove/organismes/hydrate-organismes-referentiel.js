import cliProgress from "cli-progress";
import logger from "../../../../common/logger.js";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import { fetchOrganismes } from "../../../../common/apis/apiReferentielMna.js";
import {
  createOrganisme,
  findOrganismeByUai,
  updateOrganisme,
} from "../../../../common/actions/organismes/organismes.actions.js";
import { buildAdresseFromUai } from "../../../../common/utils/uaiUtils.js";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Liste des champs à récupérer
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
 * TODO : Useless / doublon avec hydrate-organismes
 * Script qui initialise les organismes du référentiel
 * ajoute les organismes non présents (organisme stock)
 * et MAJ le champ nature des organismes déja existants
 */
export const hydrateOrganismesReferentiel = async () => {
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

    // Si aucun UAI on ne peut pas effectuer de traitement
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
      const organisme = await findOrganismeByUai(organismeReferentiel.uai);

      // Ajout de l'organisme si non existant
      if (!organisme) {
        try {
          // TODO build adresse ?
          await createOrganisme({
            uai,
            ...buildAdresseFromUai(uai),
            nature,
            sirets: [siret],
            nom: raison_sociale,
            est_dans_le_referentiel: true,
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
        const perfectUaiSiretMatch =
          organisme.sirets.length === 1 && organisme.sirets[0] === organismeReferentiel.siret;
        const updatedOrganisme = {
          ...organisme,
          nature: organismeReferentiel.nature,
          natureValidityWarning: !perfectUaiSiretMatch,
          est_dans_le_referentiel: true,
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
  logger.info(`--> ${nbOrganismeCreated} organismes créés depuis le référentiel`);
  logger.info(`--> ${nbOrganismeNotCreated} organismes non créés depuis le référentiel (erreur)`);
  logger.info(`---> ${nbOrganismeUpdated} organismes mis à jour depuis le référentiel (nature)`);
  logger.info(`---> ${nbOrganismeNotUpdated} organismes non mis à jour depuis le référentiel (erreur)`);
};
