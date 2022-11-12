import { ObjectId } from "mongodb";
import { reseauxCfasDb } from "../model/collections";
import { escapeRegExp } from "../utils/regexUtils";

const create = async ({ nom_reseau, nom_etablissement, uai, siret }) => {
  const { insertedId } = await reseauxCfasDb().insertOne({
    nom_reseau,
    nom_etablissement,
    uai,
    siret,
    created_at: new Date(),
  });

  // TODO return only inserted id (single responsibility)
  return await reseauxCfasDb().findOne({ _id: insertedId });
};

/**
 * Returns list of RESEAU CFA information matching passed criteria
 * @param {{}} searchCriteria
 * @return {Array<{uai: string, nom_reseau: string, nom_etablissement: string, siret: string}>} Array of RESEAU CFA information
 */
const searchReseauxCfas = async (searchCriteria) => {
  const { searchTerm } = searchCriteria;

  const matchStage = {};

  if (searchTerm) {
    matchStage.$or = [
      { $text: { $search: searchTerm } },
      { uai: new RegExp(escapeRegExp(searchTerm), "i") },
      { siret: new RegExp(escapeRegExp(searchTerm), "i") },
      { nom_reseau: new RegExp(escapeRegExp(searchTerm), "i") },
    ];
  }

  const sortStage = searchTerm ? { score: { $meta: "textScore" }, nom_etablissement: 1 } : { nom_etablissement: 1 };
  const found = await reseauxCfasDb()
    .aggregate([{ $match: matchStage }, { $sort: sortStage }])
    .toArray();

  return found.map((reseauCfa) => {
    return {
      id: reseauCfa._id,
      uai: reseauCfa.uai,
      siret: reseauCfa.siret,
      nom_reseau: reseauCfa.nom_reseau,
      nom_etablissement: reseauCfa.nom_etablissement,
    };
  });
};

/**
 * Récupération de la liste des réseaux de cfas
 * @returns
 */
const getAll = async () => {
  return await reseauxCfasDb().find().toArray();
};

export default () => ({
  delete: async (id) => {
    const _id = new ObjectId(id);
    if (!ObjectId.isValid(_id)) throw new Error("Wrong reseauxCfas _id passed");
    await reseauxCfasDb().deleteOne({ _id });
  },
  getAll,
  create,
  searchReseauxCfas,
});
