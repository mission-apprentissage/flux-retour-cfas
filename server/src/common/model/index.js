const mongoose = require("mongoose");

const getModel = (modelName) => {
  const Schema = require(`./schema/${modelName}`);
  return mongoose.model(modelName, Schema, modelName);
};

module.exports = {
  StatutCandidat: getModel("statutsCandidats"),
  User: getModel("users"),
  UserEvent: getModel("userEvents"),
  Log: getModel("logs"),
  DsDossier: getModel("dsDossiers"),
  DsStats: getModel("dsStats"),
};
