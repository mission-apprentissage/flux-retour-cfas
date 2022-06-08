const { ReseauCfaModel } = require("../model");
const { escapeRegExp } = require("../utils/regexUtils");

const create = async ({ nom_reseau, nom_etablissement, uai, siret }) => {
  const saved = await new ReseauCfaModel({
    nom_reseau,
    nom_etablissement,
    uai,
    siret,
    created_at: new Date(),
  }).save();

  return saved.toObject();
};

/**
 * Returns list of RESEAU CFA information matching passed criteria
 * @param {{}} searchCriteria
 * @return {Array<{uai: string, nom_reseau: string, nom_etablissement: string}>} Array of RESEAU CFA information
 */
const searchReseauxCfas = async (searchCriteria) => {
  const { searchTerm } = searchCriteria;
  const SEARCH_RESULTS_LIMIT = 50;

  const matchStage = {};
  if (searchTerm) {
    matchStage.$or = [{ $text: { $search: searchTerm } }, { uai: new RegExp(escapeRegExp(searchTerm), "g") }];
  }

  const sortStage = searchTerm
    ? {
        score: { $meta: "textScore" },
        nom_etablissement: 1,
      }
    : { nom_etablissement: 1 };

  const found = await ReseauCfaModel.aggregate([
    { $match: matchStage },
    { $sort: sortStage },
    { $limit: SEARCH_RESULTS_LIMIT },
  ]);

  return found.map((reseauCfa) => {
    return {
      id: reseauCfa._id,
      uai: reseauCfa.uai,
      nom_reseau: reseauCfa.nom_reseau,
      nom_etablissement: reseauCfa.nom_etablissement,
    };
  });
};

module.exports = () => ({
  getAll: async () => {
    return await ReseauCfaModel.find().lean();
  },
  delete: async (id) => {
    return await ReseauCfaModel.deleteOne({ _id: id });
  },
  create,
  searchReseauxCfas,
});
