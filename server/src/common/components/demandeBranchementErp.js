const { demandesBranchementErpDb } = require("../model/collections");

const create = async (props) => {
  const { erp, nom_organisme, uai_organisme, email_demandeur, nb_apprentis, is_ready_co_construction = false } = props;

  const { insertedId } = await demandesBranchementErpDb().insertOne({
    erp,
    nom_organisme,
    uai_organisme,
    email_demandeur,
    nb_apprentis,
    is_ready_co_construction,
    created_at: new Date(),
  });

  return await demandesBranchementErpDb().findOne({ _id: insertedId });
};

module.exports = () => ({
  create,
});
