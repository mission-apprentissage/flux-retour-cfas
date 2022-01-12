const mongoose = require("mongoose");

const getModel = (modelName, paginateEnabled = false) => {
  const Schema = require(`./schema/${modelName}`);
  paginateEnabled === true && Schema.plugin(require("mongoose-paginate"));
  return mongoose.model(modelName, Schema, modelName);
};

module.exports = {
  StatutCandidatModel: getModel("statutsCandidats"),
  UserModel: getModel("users"),
  UserEventModel: getModel("userEvents"),
  JobEventModel: getModel("jobEvents", true),
  DuplicateEventModel: getModel("duplicatesEvents"),
  CfaModel: getModel("cfas", true),
  CfaAnnuaireModel: getModel("cfasAnnuaire"),
  CroisementCfasAnnuaireModel: getModel("croisementCfasAnnuaire"),
  CfaDataFeedbackModel: getModel("cfaDataFeedback"),
  FormationModel: getModel("formations"),
  LogModel: getModel("logs"),
  CroisementVoeuxAffelnetModel: getModel("croisementVoeuxAffelnet"),
  RcoStatutCandidatModel: getModel("rcoStatutsCandidats"),
  DemandeIdentifiantsModel: getModel("demandesIdentifiants"),
  DemandeLienPriveModel: getModel("demandesLienPrive"),
  DemandeBranchementErpModel: getModel("demandesBranchementErp"),
};
