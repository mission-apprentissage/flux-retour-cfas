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
import { dossiersApprenantsDb, jobEventsDb } from "../../../common/model/collections.js";
import { updateDossierApprenant } from "../../../common/actions/dossiersApprenants.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const JOBNAME = "hydrate-organismes-reseaux";

// TODO : voir coté métier quels réseaux on gère
const CFAS_NETWORKS = [
  RESEAUX_CFAS.CMA,
  RESEAUX_CFAS.UIMM,
  RESEAUX_CFAS.AGRI,
  RESEAUX_CFAS.MFR,
  RESEAUX_CFAS.CCI,
  RESEAUX_CFAS.GRETA,
  RESEAUX_CFAS.AFTRAL,
];

/**
 * Script qui initialise les nouveaux organismes "stock" trouvés depuis les fichiers de réseaux
 * et MAJ les réseaux d'organismes déja existants
 */
export const hydrateOrganismesFromReseaux = async (ovhStorage) => {
  // Parse des réseaux
  await asyncForEach(CFAS_NETWORKS, async ({ nomReseau, nomFichier }) => {
    const organismesForNetwork = await getOrganismesListForNetwork(ovhStorage, nomFichier);
    await hydrateForNetwork(organismesForNetwork, nomReseau);
  });
};

/**
 * Téléchargement si nécessaire du CSV du réseau et récupération de la liste des organismes
 * @param {*} ovhStorage
 * @param {*} nomFichier
 * @returns
 */
const getOrganismesListForNetwork = async (ovhStorage, nomFichier) => {
  // Get Reference CSV File if needed
  const cfasReferenceFilePath = path.join(__dirname(import.meta.url), `./assets/${nomFichier}.csv`);
  await ovhStorage.downloadIfNeededFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath, {
    clearFile: true,
  });
  return readJsonFromCsvFile(cfasReferenceFilePath);
};

/**
 * Gestion des organismes d'un réseau
 * @param {*} reseau
 */
const hydrateForNetwork = async (allOrganismesForReseau, nomReseau) => {
  logger.info(`Traitement des organismes du réseau ${nomReseau}`);
  loadingBar.start(allOrganismesForReseau.length, 0);

  // Parse all organisme
  await asyncForEach(allOrganismesForReseau, async (currentOrganisme) => {
    loadingBar.increment();

    // Check organisme existance
    let organisme = await findOrganismeByUai(currentOrganisme?.uai);

    if (!organisme) {
      try {
        organisme = await createOrganisme({
          uai: currentOrganisme?.uai,
          ...buildAdresseFromUai(currentOrganisme?.uai),
          nom: currentOrganisme?.nom_etablissement ?? "",
        });
      } catch (err) {
        // Store log organisme création failed
        await jobEventsDb().insertOne({
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
      if (nomReseau === RESEAUX_CFAS.AGRI.nomReseau && organisme.erps.includes(ERPS.GESTI.nomErp.toLowerCase())) {
        return;
      }

      // Update des réseaux de l'organisme si nécessaire
      await updateOrganismeNetworksIfNeeded(organisme, nomReseau);

      // Update des dossiersApprenants de l'organisme si nécessaire
      await updateDossiersApprenantsNetworksIfNeeded(organisme, nomReseau);
    }
  });

  loadingBar.stop();
  logger.info(`All organismes from ${nomReseau} network were handled !`);
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
  }
};

/**
 * MAJ les réseaux des dossiersApprenants de l'organisme si nécessaire
 * @param {*} organismeInReferentiel
 * @param {*} nomReseau
 */
const updateDossiersApprenantsNetworksIfNeeded = async (organisme, nomReseau) => {
  // Récupération de tous les dossiersApprenants de cet organismes qui n'ont pas ce réseau dans leur liste
  const dossiersApprenantsForOrganismeWithoutThisNetwork = await dossiersApprenantsDb()
    .find({ uai: organisme.uai, etablissement_reseaux: { $ne: nomReseau } })
    .toArray();

  await asyncForEach(dossiersApprenantsForOrganismeWithoutThisNetwork, async (dossierToUpdate) => {
    await updateDossierApprenant(dossierToUpdate._id, {
      ...dossierToUpdate,
      etablissement_reseaux: [...dossierToUpdate.etablissement_reseaux, nomReseau],
    });
  });
};
