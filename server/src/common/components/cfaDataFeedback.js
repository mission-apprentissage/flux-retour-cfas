const { CfaDataFeedback: CfaDataFeedbackModel } = require("../model");
const { validateUai } = require("../domain/uai");

module.exports = () => ({
  createCfaDataFeedback,
});

/**
 * Creates a new CfaDataFeedback in DB
 * @return {CfaDataFeedback | null} The newly created CfaDataFeedback or null
 */
const createCfaDataFeedback = async ({ uai, email, details }) => {
  if (!validateUai(uai)) {
    throw Error("Invalid SIRET");
  }

  const newCfaDataFeedbackDocument = new CfaDataFeedbackModel({
    uai,
    email,
    details,
    created_at: new Date(),
  });

  const saved = await newCfaDataFeedbackDocument.save();
  return saved.toObject();
};
