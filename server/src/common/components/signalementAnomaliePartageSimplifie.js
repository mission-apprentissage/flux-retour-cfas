const { SignalementAnomalieFactory } = require("../factory/signalementAnomalieFactory.js");
const { PartageSimplifieSignalementAnomalieModel } = require("../model/index.js");

/**
 * Création d'un message de signalement d'anomalie
 * @param {*} param0
 * @returns
 */
const createSignalementAnomalie = async (email, message) => {
  const entity = SignalementAnomalieFactory.create({ email, message });
  if (entity === null) return null;

  const saved = await new PartageSimplifieSignalementAnomalieModel(entity).save();
  return saved.toObject();
};

module.exports = () => ({
  createSignalementAnomalie,
});
