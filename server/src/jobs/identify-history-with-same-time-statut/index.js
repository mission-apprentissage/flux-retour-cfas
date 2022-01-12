const omit = require("lodash.omit");
const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { jobNames } = require("../../common/model/constants");

const hasStatutsWithSameDateInHistorique = (historique) => {
  const dates = [];
  for (let index = 0; index < historique.length; index++) {
    const date = historique[index].date_statut.getTime();
    if (dates.includes(date)) {
      return true;
    }
    dates.push(date);
  }
  return false;
};

runScript(async ({ db }) => {
  const resultCollection = db.collection("statutsAvecDateIdentiqueDansHistorique");
  // create a cursor over all the statuts with an historique of size > 1
  const statutsCandidatsCollection = db.collection("statutsCandidats");
  const cursor = statutsCandidatsCollection.find({ "historique_statut_apprenant.1": { $exists: true } });

  let count = 0;
  while (await cursor.hasNext()) {
    const document = await cursor.next();
    if (hasStatutsWithSameDateInHistorique(document.historique_statut_apprenant)) {
      resultCollection.insertOne({ ...omit(document, "_id"), original_id: document._id });
      count++;
    }
  }
  logger.info(
    `Fond ${count} documents with at least two statuts with equal dates in historique_statut_apprenant and stored them in collection statutsAvecDateIdentiqueDansHistorique`
  );
}, jobNames.statutsAvecDateIdentiqueDansHistorique);
