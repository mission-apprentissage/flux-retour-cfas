const express = require("express");
const { Parser } = require("json2csv");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { getAnneesScolaireListFromDate } = require("../../common/utils/anneeScolaireUtils");
const { tdbRoles } = require("../../common/roles");

const validateRequestQuery = require("../middlewares/validateRequestQuery");
const { getExportAnonymizedEventNameFromFilters } = require("../../common/constants/userEventsConstants");

const filterQueryForNetworkRole = (req) => {
  if (req.user?.permissions.includes(tdbRoles.network)) {
    req.query.etablissement_reseaux = req.user.network;
  }
};

const filterQueryForCfaRole = (req) => {
  if (req.user?.permissions.includes(tdbRoles.cfa)) {
    req.query.uai_etablissement = req.user?.username;
  }
};

const applyUserRoleFilter = (req, _res, next) => {
  // users with network role should not be able to see data for other reseau
  filterQueryForNetworkRole(req);

  // users with cfa role should not be able to see data for other cfas
  filterQueryForCfaRole(req);

  next();
};

const commonEffectifsFilters = {
  etablissement_num_region: Joi.string().allow(null, ""),
  etablissement_num_departement: Joi.string().allow(null, ""),
  formation_cfd: Joi.string().allow(null, ""),
  uai_etablissement: Joi.string().allow(null, ""),
  siret_etablissement: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
};

module.exports = ({ effectifs, userEvents }) => {
  const router = express.Router();

  /**
   * Export the anonymized effectifs lists for input period & query
   */
  router.get(
    "/export-csv-list",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        namedDataMode: Joi.boolean(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      // Gets & format params
      const { date: dateFromParams, namedDataMode, ...filtersFromBody } = req.query;
      const namedDataListMode = namedDataMode ? Boolean(namedDataMode) : false;
      const date = new Date(dateFromParams);
      const filters = { ...filtersFromBody, annee_scolaire: { $in: getAnneesScolaireListFromDate(date) } };

      // create user event
      await userEvents.create({
        action: getExportAnonymizedEventNameFromFilters(filters),
        username: req.user.username,
        data: req.query,
      });

      const dataList = await effectifs.getDataListEffectifsAtDate(date, filters, namedDataListMode);

      // Parse to french localized CSV with specific fields order & labels (; as delimiter and UTF8 using withBOM)
      const DEFAULT_FIELDS = [
        {
          label: "Indicateur",
          value: "indicateur",
        },
        {
          label: "Intitulé de la formation",
          value: "libelle_long_formation",
        },
        {
          label: "Code formation diplôme",
          value: "formation_cfd",
        },
        {
          label: "RNCP",
          value: "formation_rncp",
        },
        {
          label: "Année de la formation",
          value: "annee_formation",
        },
        {
          label: "Date de début de la formation",
          value: "date_debut_formation",
        },
        {
          label: "Date de fin de la formation",
          value: "date_fin_formation",
        },
        {
          label: "UAI de l’organisme de formation",
          value: "uai_etablissement",
        },
        {
          label: "SIRET de l’organisme de formation",
          value: "siret_etablissement",
        },
        {
          label: "Dénomination de l'organisme",
          value: "nom_etablissement",
        },
        {
          label: "Réseau(x)",
          value: "etablissement_reseaux",
        },
        {
          label: "Code postal de l'organisme",
          value: "etablissement_code_postal",
        },
        {
          label: "Région de l'organisme",
          value: "etablissement_nom_region",
        },
        {
          label: "Département de l'organisme",
          value: "etablissement_nom_departement",
        },
        {
          label: "Date de début du contrat en apprentissage",
          value: "contrat_date_debut",
        },
        {
          label: "Date de fin du contrat en apprentissage",
          value: "contrat_date_fin",
        },
        {
          label: "Date de rupture de contrat",
          value: "contrat_date_rupture",
        },
      ];

      const NAMED_FIELDS = [
        {
          label: "Nom apprenant",
          value: "nom_apprenant",
        },
        {
          label: "Prénom apprenant",
          value: "prenom_apprenant",
        },
        {
          label: "Date de naissance apprenant",
          value: "date_de_naissance_apprenant",
        },
      ];

      const exportFields = namedDataListMode === true ? DEFAULT_FIELDS.concat(NAMED_FIELDS) : DEFAULT_FIELDS;
      const json2csvParser = new Parser({ fields: exportFields, delimiter: ";", withBOM: true });
      const csv = await json2csvParser.parse(dataList);
      return res.attachment("export-csv-effectifs-anonymized-list.csv").send(csv);
    })
  );

  return router;
};
