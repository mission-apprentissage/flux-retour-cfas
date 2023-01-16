import express from "express";
import { Parser } from "json2csv";
import Joi from "joi";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import { getAnneesScolaireListFromDate } from "../../../../common/utils/anneeScolaireUtils.js";
import {
  getExportAnonymizedEventNameFromFilters,
  USER_EVENTS_TYPES,
} from "../../../../common/constants/userEventsConstants.js";
import { createUserEvent } from "../../../../common/actions/userEvents.actions.js";
import { ObjectId } from "mongodb";
import { findOrganismeById } from "../../../../common/actions/organismes/organismes.actions.js";

const commonEffectifsFilters = {
  organisme_id: Joi.string().required(),
  etablissement_num_region: Joi.string().allow(null, ""),
  etablissement_num_departement: Joi.string().allow(null, ""),
  formation_cfd: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
};

export default ({ effectifs }) => {
  const router = express.Router();

  /**
   * Export the anonymized effectifs lists for input period & query
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const {
        date: dateFromParams,
        organisme_id,
        ...filtersFromBody
      } = await Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      }).validateAsync(req.query, { abortEarly: false });

      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        organisme_id: ObjectId(organisme_id),
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      // create user event
      await createUserEvent({
        type: USER_EVENTS_TYPES.EXPORT_CSV,
        action: getExportAnonymizedEventNameFromFilters(filters),
        username: req.user.username,
        data: req.query,
      });

      const organisme = await findOrganismeById(organisme_id);
      const dataList = await effectifs.getDataListEffectifsAtDate(date, filters);

      const dataListWithOrganismeInfo = dataList.map((item) => ({
        ...item,
        organisme_uai: organisme?.uai,
        organisme_siret: organisme?.siret,
        organisme_nom: organisme?.nom,
        organisme_reseaux: organisme?.reseaux?.join(", "),
        organisme_region: organisme?.adresse?.region,
        organisme_departement: organisme?.adresse?.departement,
      }));

      // Parse to french localized CSV with specific fields order & labels (; as delimiter and UTF8 using withBOM)
      const DEFAULT_FIELDS = [
        {
          label: "Indicateur",
          value: "indicateur",
        },
        {
          label: "Intitulé de la formation",
          value: "formation.libelle_long",
        },
        {
          label: "Code formation diplôme",
          value: "formation.cfd",
        },
        {
          label: "RNCP",
          value: "formation.rncp",
        },
        {
          label: "Année de la formation",
          value: "formation.annee",
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
          value: "organisme_uai",
        },
        {
          label: "SIRET de l’organisme de formation",
          value: "organisme_siret",
        },
        {
          label: "Dénomination de l'organisme",
          value: "organisme_nom",
        },
        {
          label: "Réseau(x)",
          value: "organisme_reseaux",
        },
        {
          label: "Région de l'organisme",
          value: "organisme_region",
        },
        {
          label: "Département de l'organisme",
          value: "organisme_departement",
        },
        // TODO Voir sous quelle forme sortir la listes contrats en V3 (versus un seul contrat dans la V2)
        // {
        //   label: "Date de début du contrat en apprentissage",
        //   value: "apprenants.contrats.date_debut",
        // },
        // {
        //   label: "Date de fin du contrat en apprentissage",
        //   value: "apprenants.contrats.date_fin",
        // },
        // {
        //   label: "Date de rupture de contrat",
        //   value: "apprenants.contrats.date_rupture",
        // },
      ];

      const json2csvParser = new Parser({ fields: DEFAULT_FIELDS, delimiter: ";", withBOM: true });
      const csv = await json2csvParser.parse(dataListWithOrganismeInfo);
      return res.attachment("export-csv-effectifs-anonymized-list.csv").send(csv);
    })
  );

  return router;
};
