import express from "express";
import { Parser } from "json2csv";

import { buildEffectifsFiltersFromRequest } from "./indicateurs.routes.js";
import { exportedFields } from "../../../common/actions/effectifs/export.js";
import { getDataListEffectifsAtDate } from "../../../common/actions/effectifs/effectifs.actions.js";

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
  router.get("/", async (req, res) => {
    const filters = await buildEffectifsFiltersFromRequest(req);
    const dataList = await getDataListEffectifsAtDate(filters);

    const json2csvParser = new Parser({
      fields: CSV_DEFAULT_FIELDS,
      delimiter: ";",
      withBOM: true,
    });
    const csv = await json2csvParser.parse(dataList);
    return res.attachment("export-csv-effectifs-anonymized-list.csv").send(csv);
  });

  return router;
};
