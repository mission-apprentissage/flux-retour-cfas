const { DemandeBranchementErpModel } = require("../model");

const create = async (props) => {
  const { erp, nom_organisme, uai_organisme, email_demandeur, nb_apprentis, is_ready_co_construction = false } = props;

  const saved = await new DemandeBranchementErpModel({
    erp,
    nom_organisme,
    uai_organisme,
    email_demandeur,
    nb_apprentis,
    is_ready_co_construction,
    created_at: new Date(),
  }).save();

  return saved.toObject();
};

module.exports = () => ({
  create,
});
