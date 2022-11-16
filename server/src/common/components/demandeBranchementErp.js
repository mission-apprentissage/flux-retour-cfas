import { demandesBranchementErpDb } from "../model/collections.js";

/**
 * Création d'une demande de branchement
 * TODO : Mutualiser avec la demande d'identifiants
 * @param {C} props
 * @returns
 */
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

export default () => ({
  create,
});
