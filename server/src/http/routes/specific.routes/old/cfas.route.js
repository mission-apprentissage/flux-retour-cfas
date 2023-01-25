import express from "express";
import Joi from "joi";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import pick from "lodash.pick";
import { cfasDb, dossiersApprenantsMigrationDb, organismesDb } from "../../../../common/model/collections.js";
import { escapeRegExp } from "../../../../common/utils/regexUtils.js";
import { getDepartementCodeFromUai } from "../../../../common/utils/uaiUtils.js";

export default ({ cfas }) => {
  const router = express.Router();

  /**
   * Gets cfas paginated list
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const params = await Joi.object({
        query: Joi.string(),
        page: Joi.number(),
        limit: Joi.number(),
      }).validateAsync(req.query, { abortEarly: false });

      const query = params.query ?? "{}";
      const page = Number(params.page ?? 1);
      const limit = Number(params.limit ?? 50);
      const skip = (page - 1) * limit;

      const jsonQuery = JSON.parse(query);
      const allData = await cfasDb().find(jsonQuery).skip(skip).limit(limit).toArray();
      const count = await cfasDb().countDocuments(jsonQuery);
      const omittedData = allData.map((item) =>
        pick(item, [
          "uai",
          "sirets",
          "nom",
          "nature",
          "nature_validity_warning",
          "reseaux",
          "region_nom",
          "region_num",
          "metiers",
        ])
      );

      return res.json({
        cfas: omittedData,
        pagination: {
          page,
          resultats_par_page: limit,
          nombre_de_page: Math.ceil(count / limit) || 1,
          total: count,
        },
      });
    })
  );

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const body = await Joi.object({
        searchTerm: Joi.string().min(3),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
      }).validateAsync(req.body, { abortEarly: false });

      const foundCfas = await searchOrganismes(body);
      return res.json(foundCfas);
    })
  );

  /**
   * Gets the dashboard data for cfa
   */
  router.get(
    "/:uai",
    tryCatch(async (req, res) => {
      const { uai } = req.params;

      const cfaFound = await cfas.getFromUai(uai);

      if (!cfaFound) {
        return res.status(404).json({ message: `No cfa found for UAI ${uai}` });
      } else {
        const sousEtablissements = await cfas.getSousEtablissementsForUai(uai);

        // Build response
        return res.json({
          libelleLong: cfaFound.nom,
          reseaux: cfaFound.reseaux,
          domainesMetiers: cfaFound.metiers,
          uai: cfaFound.uai,
          nature: cfaFound.nature,
          natureValidityWarning: cfaFound.nature_validity_warning,
          sousEtablissements,
          adresse: cfaFound.adresse,
        });
      }
    })
  );

  /**
   * Gets the uai for cfa by accessToken
   */
  router.get(
    "/url-access-token/:token",
    tryCatch(async (req, res) => {
      const { token } = req.params;

      const cfaFound = await cfas.getFromAccessToken(token);

      return cfaFound
        ? res.json({ uai: cfaFound.uai })
        : res.status(404).json({ message: `No cfa found for access_token ${token}` });
    })
  );

  /**
   * Retourne la liste des organismes matching passed criteria
   * @param {{}} searchCriteria
   * @return {Array<{uai: string, nom: string}>} Array of CFA information
   */
  const searchOrganismes = async (searchCriteria) => {
    const { searchTerm, ...otherCriteria } = searchCriteria;
    const SEARCH_RESULTS_LIMIT = 50;

    const matchStage = {};
    if (searchTerm) {
      matchStage.$or = [
        { $text: { $search: searchTerm } },
        { uai: new RegExp(escapeRegExp(searchTerm), "g") },
        { sirets: new RegExp(escapeRegExp(searchTerm), "g") },
      ];
    }
    // if other criteria have been provided, find the list of uai matching those criteria in the DossierApprenant collection
    if (Object.keys(otherCriteria).length > 0) {
      const eligibleUais = await dossiersApprenantsMigrationDb().distinct("uai_etablissement", otherCriteria);
      matchStage.uai = { $in: eligibleUais };
    }

    const sortStage = searchTerm
      ? {
          score: { $meta: "textScore" },
          nom_etablissement: 1,
        }
      : { nom_etablissement: 1 };

    const found = await organismesDb()
      .aggregate([{ $match: matchStage }, { $sort: sortStage }, { $limit: SEARCH_RESULTS_LIMIT }])
      .toArray();

    return found.map((cfa) => {
      return {
        uai: cfa.uai,
        sirets: cfa.sirets,
        nom: cfa.nom,
        nature: cfa.nature,
        departement: getDepartementCodeFromUai(cfa.uai),
      };
    });
  };

  return router;
};
