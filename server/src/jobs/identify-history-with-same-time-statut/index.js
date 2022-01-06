const omit = require("lodash.omit");
const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { jobNames, codesStatutsCandidats } = require("../../common/model/constants");

const hasStatutsInscritsOrApprentisWithSameDateInHistorique = (historique) => {
  const dates = [];
  for (let index = 0; index < historique.length; index++) {
    // check only for statuts inscrits or apprentis
    if (
      historique[index].valeur_statut === codesStatutsCandidats.inscrit ||
      historique[index].valeur_statut === codesStatutsCandidats.apprenti
    ) {
      const date = historique[index].date_statut.getTime();
      if (dates.includes(date)) {
        return true;
      }
      dates.push(date);
    }
  }
  return false;
};

runScript(async ({ db }) => {
  logger.info(`Identification for statuts inscrits / apprentis with equal dates in historique_statut_apprenant`);

  const resultCollection = db.collection("statutsAvecDateIdentiqueDansHistorique");
  // create a cursor over all the statuts with an historique of size > 1
  const statutsCandidatsCollection = db.collection("statutsCandidats");
  const cursor = statutsCandidatsCollection.find({ "historique_statut_apprenant.1": { $exists: true } });

  let count = 0;
  while (await cursor.hasNext()) {
    const document = await cursor.next();
    if (hasStatutsInscritsOrApprentisWithSameDateInHistorique(document.historique_statut_apprenant)) {
      resultCollection.insertOne({ ...omit(document, "_id"), original_id: document._id });
      count++;
    }
  }
  logger.info(
    `Fond ${count} documents with at least two statuts with equal dates in historique_statut_apprenant and stored them in collection statutsAvecDateIdentiqueDansHistorique`
  );
}, jobNames.statutsAvecDateIdentiqueDansHistorique);
