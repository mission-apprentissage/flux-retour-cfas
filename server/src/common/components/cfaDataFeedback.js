const { CfaDataFeedback: CfaDataFeedbackModel, Cfa } = require("../model");
const { validateSiret } = require("../domain/siret");

module.exports = () => ({
  createCfaDataFeedback,
  getCfaDataFeedbackBySiret,
});

/**
 * Returns formation if found with given SIRET
 * @param {string} siret
 * @return {CfaDataFeedback | null} Found CfaDataFeedback
 */
const getCfaDataFeedbackBySiret = (siret) => CfaDataFeedbackModel.findOne({ siret }).lean();

/**
 * Creates a new CfaDataFeedback in DB
 * @return {CfaDataFeedback | null} The newly created CfaDataFeedback or null
 */
const createCfaDataFeedback = async ({ siret, email, dataIsValid, details }) => {
  if (!validateSiret(siret)) {
    throw Error("Invalid SIRET");
  }

  // Add validation to CFA Referentiel
  await Cfa.findOneAndUpdate({ siret: siret }, { $set: { feedback_donnee_valide: dataIsValid } });

  const newCfaDataFeedbackDocument = new CfaDataFeedbackModel({
    siret,
    email,
    details,
    donnee_est_valide: dataIsValid,
    created_at: new Date(),
  });

  const saved = await newCfaDataFeedbackDocument.save();
  return saved.toObject();
};
