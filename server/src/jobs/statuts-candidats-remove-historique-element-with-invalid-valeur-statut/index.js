const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const cliProgress = require("cli-progress");
const { jobNames, codesStatutsCandidats } = require("../../common/model/constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de supprimer les éléments dans historique_statut_apprenant dont la valeur_statut n'est pas inscrit, abandon ou apprenti
 */
runScript(async ({ db }) => {
  logger.info("Will remove historique_statut_apprenant elements with invalid valeur_statut");

  const collection = db.collection("statutsCandidats");
  const query = { "historique_statut_apprenant.valeur_statut": { $in: [1, 4] } };

  const count = await collection.countDocuments(query);
  logger.info(`Found ${count} statuts candidat with at least one invalid valeur_statut in historique_statut_apprenant`);
  let updatedCount = 0;
  loadingBar.start(count, 0);

  const cursor = collection.find(query, { _id: 1, historique_statut_apprenant: 1 });

  while (await cursor.hasNext()) {
    const document = await cursor.next();
    // only keep valid valeur_statut
    const cleanedHistorique = document.historique_statut_apprenant.filter((historiqueElem) => {
      return Object.values(codesStatutsCandidats).includes(historiqueElem.valeur_statut);
    });

    if (cleanedHistorique.length !== document.historique_statut_apprenant) {
      await collection.findOneAndUpdate(
        { _id: document._id },
        { $set: { historique_statut_apprenant: cleanedHistorique } }
      );
      updatedCount++;
    }
    loadingBar.increment();
  }

  loadingBar.stop();
  logger.info(`Updated ${updatedCount} statuts candidat with cleaned historique`);
}, jobNames.statutsCandidatsRemoveHistoriqueElementWithInvalidValeurStatut);
