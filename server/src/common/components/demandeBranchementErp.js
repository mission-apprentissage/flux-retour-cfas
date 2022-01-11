const { DemandeBranchementErpModel } = require("../model");

const create = async (props) => {
  const { erp, nom_organisme, uai_organisme, email_demandeur, nb_apprentis } = props;

  const saved = await new DemandeBranchementErpModel({
    erp,
    nom_organisme,
    uai_organisme,
    email_demandeur,
    nb_apprentis,
    created_at: new Date(),
  }).save();

  return saved.toObject();
};

module.exports = () => ({
  create,
});
