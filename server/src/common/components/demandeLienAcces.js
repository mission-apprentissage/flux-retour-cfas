const { DemandeLienAcces } = require("../model");

const create = async (props) => {
  const { nom_organisme, uai_organisme, code_postal_organisme, email_demandeur } = props;

  const saved = await new DemandeLienAcces({
    nom_organisme,
    uai_organisme,
    code_postal_organisme,
    email_demandeur,
    created_at: new Date(),
  }).save();

  return saved.toObject();
};

module.exports = () => ({
  create,
});
