import cliProgress from "cli-progress";
import { RESEAUX_CFAS } from "../../../common/constants/networksConstants.js";
import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import path from "path";
import { __dirname } from "../../../common/utils/esmUtils.js";
import { readJsonFromCsvFile } from "../../../common/utils/fileUtils.js";
import { createOrganisme, findOrganismeByUai, updateOrganisme } from "../../../common/actions/organismes.actions.js";
import { ERPS } from "../../../common/constants/erpsConstants.js";
import { buildAdresseFromUai } from "../../../common/utils/uaiUtils.js";
import { downloadIfNeededFileTo } from "../../../common/utils/ovhStorageUtils.js";
import { createJobEvent } from "../../../common/actions/jobEvents.actions.js";
import { updateDossiersApprenantsNetworksIfNeeded } from "./hydrate-reseaux.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const JOBNAME = "hydrate-organismes-reseaux";

// TODO : voir coté métier quels réseaux on gère
const CFAS_NETWORKS_KEYS_TO_HANDLE = ["CMA", "UIMM", "AGRI", "MFR", "CCI", "GRETA", "AFTRAL"];

/**
 * Script qui initialise les données depuis les fichiers de réseaux
 * Ajout de nouveaux organismes "stock" trouvés depuis les fichiers de réseaux
 * MAJ les réseaux d'organismes déja existants
 * MAJ les dossiersApprenants liés
 */
export const hydrateFromReseaux = async () => {
  await asyncForEach(Object.keys(RESEAUX_CFAS), async (currentNetwork) => {
    if (CFAS_NETWORKS_KEYS_TO_HANDLE.includes(currentNetwork)) {
      const organismesForNetwork = await getOrganismesListForNetwork(RESEAUX_CFAS[currentNetwork].nomFichier);
      await hydrateForNetwork(organismesForNetwork, currentNetwork);
    }
  });
};

/**
 * Téléchargement si nécessaire du CSV du réseau et récupération de la liste des organismes
 * @param {*} nomFichier
 * @returns
 */
const getOrganismesListForNetwork = async (nomFichier) => {
  // Get Reference CSV File if needed
  const cfasReferenceFilePath = path.join(__dirname(import.meta.url), `./assets/${nomFichier}.csv`);
  await downloadIfNeededFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath, {
    clearFile: true,
  });
  return readJsonFromCsvFile(cfasReferenceFilePath);
};

/**
 * Gestion des organismes d'un réseau
 * @param {*} reseau
 */
const hydrateForNetwork = async (allOrganismesForReseau, reseau) => {
  logger.info(`Traitement des organismes du réseau ${reseau}`);
  loadingBar.start(allOrganismesForReseau.length, 0);

  let nbOrganismesCreated = 0;
  let nbOrganismesNotCreated = 0;
  let nbOrganismesUpdated = 0;
  let nbDossiersApprenantsUpdated = 0;

  // Parse all organisme
  await asyncForEach(allOrganismesForReseau, async (currentOrganisme) => {
    loadingBar.increment();

    // Check organisme existance
    let organisme = await findOrganismeByUai(currentOrganisme?.uai);
    let newOrganismeCreated = false;

    if (!organisme) {
      try {
        organisme = await createOrganisme({
          uai: currentOrganisme?.uai,
          ...buildAdresseFromUai(currentOrganisme?.uai),
          nom: currentOrganisme?.nom ?? "",
          reseaux: [reseau],
        });
        newOrganismeCreated = true;
        nbOrganismesCreated++;
        // Store log organisme création
        await createJobEvent({
          jobname: JOBNAME,
          date: new Date(),
          action: "create-organisme-success",
          data: { organisme: currentOrganisme },
        });
      } catch (err) {
        nbOrganismesNotCreated++;
        // Store log organisme création failed
        await createJobEvent({
          jobname: JOBNAME,
          date: new Date(),
          action: "create-organisme-error",
          data: { organisme: currentOrganisme },
        });
      }
    }

    // Si organisme déja présent ou création ok
    if (organisme) {
      // TODO Rechecker coté métier cette règle
      // Do not handle organisme in network AGRI and having GESTI as ERP
      if (reseau === "AGRI" && organisme.erps.includes(ERPS.GESTI.nomErp.toLowerCase())) {
        return;
      }

      // Update des réseaux de l'organisme si nécessaire (si organisme déja existant à la base)
      if (newOrganismeCreated === false) {
        if ((await updateOrganismeNetworksIfNeeded(organisme, reseau)) === true) nbOrganismesUpdated++;
      }

      // Update des dossiersApprenants de l'organisme si nécessaire
      const nbDossierUpdatedForOrganisme = await updateDossiersApprenantsNetworksIfNeeded(organisme, reseau, JOBNAME);
      nbDossiersApprenantsUpdated += nbDossierUpdatedForOrganisme;
    }
  });

  loadingBar.stop();
  logger.info(`Réseau ${reseau} : ${nbOrganismesCreated} organismes créés`);
  logger.info(`Réseau ${reseau} : ${nbOrganismesNotCreated} organismes non créés à cause d'erreurs`);
  logger.info(`Réseau ${reseau} : ${nbOrganismesUpdated} organismes dont la liste des réseaux a été mis à jour`);
  logger.info(
    `Réseau ${reseau} : ${nbDossiersApprenantsUpdated} dossiersApprenants dont la liste des réseaux a été mis à jour`
  );
};

/**
 * MAJ les réseaux de l'organisme si nécessaire
 * @param {*} organismeInReferentiel
 * @param {*} nomReseau
 */
const updateOrganismeNetworksIfNeeded = async (organisme, nomReseau) => {
  // Si cet organisme n'a pas déja ce réseau dans sa liste alors ajout du réseau aux réseaux existants de l'organisme
  if (!organisme?.reseaux.some((item) => item === nomReseau)) {
    await updateOrganisme(organisme._id, { ...organisme, reseaux: [...organisme.reseaux, nomReseau] });

    // Log update
    await createJobEvent({
      jobname: JOBNAME,
      date: new Date(),
      action: "update-organisme-success",
      data: { organisme },
    });

    return true;
  }
  return false;
};
