const cliProgress = require("cli-progress");
const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ db }) => {
  const collection = db.collection("statutsCandidats");
  // find date_statut of type string
  const query = { "historique_statut_apprenant.date_statut": { $type: 2 } };

  const documentsCount = await collection.countDocuments(query);
  logger.info("will process", documentsCount, "documents");
  loadingBar.start(documentsCount, 0);

  const cursor = collection.find(query, { _id: 1, historique_statut_apprenant: 1 });
  while (await cursor.hasNext()) {
    const document = await cursor.next();
    const historique = document.historique_statut_apprenant.map((histoElem) => {
      if (typeof histoElem.date_statut === "string") {
        return { ...histoElem, date_statut: new Date(histoElem.date_statut) };
      }
      return histoElem;
    });
    await collection.findOneAndUpdate({ _id: document._id }, { $set: { historique_statut_apprenant: historique } });
    loadingBar.increment();
  }
  loadingBar.stop();
}, "fix-historique-statut-apprenant-date-statut-string");
