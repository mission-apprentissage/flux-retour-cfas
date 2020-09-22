const mongoose = require("mongoose");

const getModel = (modelName, callback = () => ({})) => {
  const Schema = require(`./schema/${modelName}`);
  callback(Schema);
  return mongoose.model(modelName, Schema, modelName);
};

module.exports = {
  StatutCandidat: getModel("statutsCandidats"),
  User: getModel("users"),
  Log: getModel("logs"),
};
