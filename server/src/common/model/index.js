const mongoose = require("mongoose");

const getModel = (modelName, { enablePagination = false } = {}) => {
  const Schema = require(`./schema/${modelName}`);
  enablePagination === true && Schema.plugin(require("mongoose-paginate"));
  return mongoose.model(modelName, Schema, modelName);
};

module.exports = {
  DossierApprenantModel: getModel("dossiersApprenants", { enablePagination: true }),
  UserModel: getModel("users"),
  UserEventModel: getModel("userEvents"),
  JobEventModel: getModel("jobEvents", { enablePagination: true }),
  DuplicateEventModel: getModel("duplicatesEvents"),
  CfaModel: getModel("cfas", { enablePagination: true }),
  ReseauCfaModel: getModel("reseauxCfas"),
  CfaAnnuaireModel: getModel("cfasAnnuaire"),
  CroisementCfasAnnuaireModel: getModel("croisementCfasAnnuaire"),
  ContactCfaModel: getModel("contactsCfas"),
  FormationModel: getModel("formations"),
  LogModel: getModel("logs"),
  CroisementVoeuxAffelnetModel: getModel("croisementVoeuxAffelnet"),
  EffectifApprenantModel: getModel("effectifsApprenants", { enablePagination: true }),
  DemandeIdentifiantsModel: getModel("demandesIdentifiants"),
  DemandeLienPriveModel: getModel("demandesLienPrive"),
  DemandeBranchementErpModel: getModel("demandesBranchementErp"),
};
