const { CfaDataFeedback: CfaDataFeedbackModel } = require("../model");
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
const createCfaDataFeedback = async ({ siret, email, details }) => {
  if (!validateSiret(siret)) {
    throw Error("Invalid SIRET");
  }

  const newCfaDataFeedbackDocument = new CfaDataFeedbackModel({
    siret,
    email,
    details,
    created_at: new Date(),
  });

  const saved = await newCfaDataFeedbackDocument.save();
  return saved.toObject();
};
