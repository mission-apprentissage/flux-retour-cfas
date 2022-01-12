const { CfaDataFeedbackModel, CfaModel } = require("../model");
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
    throw Error("Invalid UAI");
  }

  const cfaFromUai = await CfaModel.findOne({ uai: uai }).lean();

  const newCfaDataFeedbackDocument = new CfaDataFeedbackModel({
    uai,
    email,
    details,
    region_nom: cfaFromUai?.region_nom,
    region_num: cfaFromUai?.region_num,
    created_at: new Date(),
  });

  const saved = await newCfaDataFeedbackDocument.save();
  return saved.toObject();
};
