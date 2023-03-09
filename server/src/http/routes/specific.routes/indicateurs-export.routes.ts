import express from "express";
import { Parser } from "json2csv";
import tryCatch from "../../middlewares/tryCatchMiddleware";
import {
  getExportAnonymizedEventNameFromFilters,
  USER_EVENTS_TYPES,
} from "../../../common/constants/userEventsConstants";
import { createUserEvent } from "../../../common/actions/userEvents.actions";
import { buildEffectifsFiltersFromRequest } from "./indicateurs.routes";
import { exportedFields } from "../../../common/actions/effectifs/export";
import { getDataListEffectifsAtDate } from "../../../common/actions/effectifs/effectifs.actions";

// Parse to french localized CSV with specific fields order & labels (; as delimiter and UTF8 using withBOM)
const CSV_DEFAULT_FIELDS = [
  {
    label: "Indicateur",
    value: "indicateur",
  },
  ...exportedFields.map((item) => ({
    label: item.label,
    value: item.csvField,
  })),
];

export default () => {
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

      const dataList = await getDataListEffectifsAtDate(filters);

      const json2csvParser = new Parser({
        fields: CSV_DEFAULT_FIELDS,
        delimiter: ";",
        withBOM: true,
      });
      const csv = await json2csvParser.parse(dataList);
      return res.attachment("export-csv-effectifs-anonymized-list.csv").send(csv);
    })
  );

  return router;
};
