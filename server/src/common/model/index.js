const mongoose = require("mongoose");

const getModel = (modelName, paginateEnabled = false) => {
  const Schema = require(`./schema/${modelName}`);
  paginateEnabled === true && Schema.plugin(require("mongoose-paginate"));
  return mongoose.model(modelName, Schema, modelName);
};

module.exports = {
  StatutCandidat: getModel("statutsCandidats"),
  User: getModel("users"),
  UserEvent: getModel("userEvents"),
  JobEvent: getModel("jobEvents", true),
  DuplicateEvent: getModel("duplicatesEvents"),
  Cfa: getModel("cfas", true),
  CfaAnnuaire: getModel("cfasAnnuaire"),
  CroisementCfasAnnuaire: getModel("croisementCfasAnnuaire"),
  CfaDataFeedback: getModel("cfaDataFeedback"),
  Formation: getModel("formations"),
  Log: getModel("logs"),
  CroisementVoeuxAffelnet: getModel("croisementVoeuxAffelnet"),
  RcoStatutCandidat: getModel("rcoStatutsCandidats"),
  DemandeIdentifiantsModel: getModel("demandesIdentifiants"),
  DemandeLienPriveModel: getModel("demandesLienPrive"),
  DemandeBranchementErp: getModel("demandesBranchementErp"),
};
