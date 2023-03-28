import { Parser } from "json2csv";

import { AuthContext } from "../../model/internal/AuthContext.js";
import { EffectifsFilters } from "../helpers/filters";
import { getDataListEffectifsAtDate } from "./effectifs.actions.js";
import { exportedFields } from "./export.js";

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

export async function exportAnonymizedEffectifsAsCSV(ctx: AuthContext, filters: EffectifsFilters) {
  const effectifs = await getDataListEffectifsAtDate(filters);

  const json2csvParser = new Parser({
    fields: CSV_DEFAULT_FIELDS,
    delimiter: ";",
    withBOM: true,
  });
  const csvFile = await json2csvParser.parse(effectifs);
  return csvFile;
}
