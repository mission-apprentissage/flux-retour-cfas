const omit = require("lodash.omit");
const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { collectionNames } = require("../constants");

const hasTwoLastElementsWithSameDate = (historique) => {
  if (historique.length < 2) return false;
  const lastElement = historique.at(-1);
  const beforeLastElement = historique.at(-2);
  if (lastElement.date_statut.getTime() === beforeLastElement.date_statut.getTime()) {
    return true;
  }
  return false;
};

runScript(async ({ db }) => {
  logger.info(`Identification of statuts with two last elements with identical dates in historique_statut_apprenant`);

  const resultCollection = db.collection(collectionNames.statutsAvecDerniersElementsHistoriqueDateIdentique);
  await resultCollection.deleteMany();
  // create a cursor over all the statuts with an historique of size > 1
  const dosssiersApprenantsCollection = db.collection("dossiersApprenants");
  const cursor = dosssiersApprenantsCollection.find({
    annee_scolaire: "2021-2022",
    "historique_statut_apprenant.1": { $exists: true },
  });

  let count = 0;
  while (await cursor.hasNext()) {
    const document = await cursor.next();
    if (hasTwoLastElementsWithSameDate(document.historique_statut_apprenant)) {
      resultCollection.insertOne({ ...omit(document, "_id"), original_id: document._id });
      count++;
    }
  }
  logger.info(
    `Found ${count} documents with equal dates in two last elements of historique_statut_apprenant and stored them in collection ${collectionNames.statutsAvecDerniersElementsHistoriqueDateIdentique}`
  );
}, JOB_NAMES.statutsAvecDerniersElementsHistoriqueDateIdentique);
