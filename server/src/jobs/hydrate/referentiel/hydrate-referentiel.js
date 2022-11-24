import cliProgress from "cli-progress";
import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { fetchOrganismes } from "../../../common/apis/apiReferentielMna.js";
import { createOrganisme, findOrganismeByUai, updateOrganisme } from "../../../common/actions/organismes.actions.js";
import { jobEventsDb } from "../../../common/model/collections.js";
import { buildAdresseFromUai } from "../../../common/utils/uaiUtils.js";

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
 * Script qui initialise les organismes du référentiel
 * ajoute les organismes non présents (organisme stock)
 * et MAJ le champ nature des organismes déja existants
 */
export const hydrateReferentiel = async () => {
  // Fetch organismes from referentiel api
  const { organismes } = await fetchOrganismes({
    champs: REFERENTIEL_FIELDS_TO_FETCH.join(","),
    itemsPerPage: 10000,
  });

  let nbOrganismeCreated = 0;
  let nbOrganismeUpdated = 0;

  logger.info(`Traitement de ${organismes.length} organismes provenant du référentiel...`);
  loadingBar.start(organismes.length, 0);

  await asyncForEach(organismes, async (organismeReferentiel) => {
    const organisme = await findOrganismeByUai(organismeReferentiel.uai);

    if (organisme) {
      // Ajout de l'organisme
      const { uai, siret, raison_sociale, nature } = organismeReferentiel;
      await createOrganisme({
        uai,
        ...buildAdresseFromUai(uai),
        nature,
        sirets: [siret],
        nom: raison_sociale,
      });
      nbOrganismeCreated++;

      // Log & store
      await jobEventsDb().insertOne({
        jobname: "hydrate-referentiel",
        date: new Date(),
        action: "organisme-created",
        data: { organisme: organismeReferentiel },
      });
    } else {
      // Update de l'organisme en settant la nature et un flag natureValidityWarning = perfectMatch
      const perfectUaiSiretMatch = organisme.sirets.length === 1 && organisme.sirets[0] === organismeReferentiel.siret;
      const updatedOrganisme = {
        ...organisme,
        nature: organismeReferentiel.nature,
        natureValidityWarning: !perfectUaiSiretMatch,
      };
      await updateOrganisme(organisme._id, updatedOrganisme);
      nbOrganismeUpdated++;

      // Log & store
      await jobEventsDb().insertOne({
        jobname: "hydrate-referentiel",
        date: new Date(),
        action: "organisme-updated",
        data: { organisme: updatedOrganisme },
      });
    }

    loadingBar.increment();
  });

  loadingBar.stop();

  // Log & stats
  logger.info(`--> ${nbOrganismeCreated} organismes créés depuis le référentiel`);
  logger.info(`--> ${nbOrganismeUpdated} organismes mis à jour depuis le référentiel (nature)`);
};
