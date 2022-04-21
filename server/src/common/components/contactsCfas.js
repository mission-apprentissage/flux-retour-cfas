const { ContactCfaModel } = require("../model");

const create = async ({ uai, siret, email_contact, email_contact_confirme, sources }) => {
  const saved = await new ContactCfaModel({
    uai,
    siret,
    email_contact,
    email_contact_confirme,
    sources,
    created_at: new Date(),
  }).save();

  return saved.toObject();
};

module.exports = () => ({
  create,
});
