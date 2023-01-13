import express from "express";
import { Parser } from "json2csv";
import Joi from "joi";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import { getAnneesScolaireListFromDate } from "../../../../common/utils/anneeScolaireUtils.js";
import { tdbRoles } from "../../../../common/roles.js";
import {
  getExportAnonymizedEventNameFromFilters,
  USER_EVENTS_TYPES,
} from "../../../../common/constants/userEventsConstants.js";
import { createUserEvent } from "../../../../common/actions/userEvents.actions.js";

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

export default ({ effectifs }) => {
  const router = express.Router();

  /**
   * Export the anonymized effectifs lists for input period & query
   */
  router.get(
    "/export-csv-list",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      const { date: dateFromParams, ...filtersFromBody } = await Joi.object({
        date: Joi.date().required(),
        namedDataMode: Joi.boolean(),
        ...commonEffectifsFilters,
      }).validateAsync(req.query, { abortEarly: false });

      //   const namedDataListMode = namedDataMode ? Boolean(namedDataMode) : false;
      const date = new Date(dateFromParams);
      const filters = { ...filtersFromBody, annee_scolaire: { $in: getAnneesScolaireListFromDate(date) } };

      // create user event
      await createUserEvent({
        type: USER_EVENTS_TYPES.EXPORT_CSV,
        action: getExportAnonymizedEventNameFromFilters(filters),
        username: req.user.username,
        data: req.query,
      });

      const dataList = await effectifs.getDataListEffectifsAtDate(date, filters);

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

      // TODO remove named fields
      //   const NAMED_FIELDS = [
      //     {
      //       label: "Nom apprenant",
      //       value: "nom_apprenant",
      //     },
      //     {
      //       label: "Prénom apprenant",
      //       value: "prenom_apprenant",
      //     },
      //     {
      //       label: "Date de naissance apprenant",
      //       value: "date_de_naissance_apprenant",
      //     },
      //   ];

      const json2csvParser = new Parser({ fields: DEFAULT_FIELDS, delimiter: ";", withBOM: true });
      const csv = await json2csvParser.parse(dataList);
      return res.attachment("export-csv-effectifs-anonymized-list.csv").send(csv);
    })
  );

  return router;
};
