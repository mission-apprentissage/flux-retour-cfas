import express from "express";
import { Parser } from "json2csv";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import {
  getExportAnonymizedEventNameFromFilters,
  USER_EVENTS_TYPES,
} from "../../../common/constants/userEventsConstants.js";
import { createUserEvent } from "../../../common/actions/userEvents.actions.js";
import { buildEffectifsFiltersFromRequest } from "./indicateurs.routes.js";

// Parse to french localized CSV with specific fields order & labels (; as delimiter and UTF8 using withBOM)
const CSV_DEFAULT_FIELDS = [
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

export default ({ effectifs }) => {
  const router = express.Router();

  /**
   * Export the anonymized effectifs lists for input period & query
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const filters = await buildEffectifsFiltersFromRequest(req);

      await createUserEvent({
        type: USER_EVENTS_TYPES.EXPORT_CSV,
        action: getExportAnonymizedEventNameFromFilters(filters),
        username: req.user.username,
        data: req.query,
      });

      // const organisme = await findOrganismeById(filters.organisme_id);
      const dataList = await effectifs.getDataListEffectifsAtDate(filters);

      const dataListWithOrganismeInfo = dataList.map((item) => ({
        ...item,
        // organisme_uai: organisme?.uai,
        // organisme_siret: organisme?.siret,
        // organisme_nom: organisme?.nom,
        // organisme_reseaux: organisme?.reseaux?.join(", "),
        // organisme_region: organisme?.adresse?.region,
        // organisme_departement: organisme?.adresse?.departement,
      }));

      const json2csvParser = new Parser({ fields: CSV_DEFAULT_FIELDS, delimiter: ";", withBOM: true });
      const csv = await json2csvParser.parse(dataListWithOrganismeInfo);
      return res.attachment("export-csv-effectifs-anonymized-list.csv").send(csv);
    })
  );

  return router;
};
