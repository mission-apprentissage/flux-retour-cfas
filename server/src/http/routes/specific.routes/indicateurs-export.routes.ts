import { Parser } from "json2csv";

import {
  getExportAnonymizedEventNameFromFilters,
  USER_EVENTS_TYPES,
} from "../../../common/constants/userEventsConstants.js";
import { createUserEvent } from "../../../common/actions/userEvents.actions.js";
import { buildEffectifsFiltersFromRequest } from "./indicateurs.routes.js";
import { exportedFields } from "../../../common/actions/effectifs/export.js";
import { getDataListEffectifsAtDate } from "../../../common/actions/effectifs/effectifs.actions.js";
import { Request, Response } from "express-serve-static-core";

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

/**
 * Export the anonymized effectifs lists for input period & query
 */
export async function indicateursExport(req: Request, res: Response) {
  // TODO connaitre le contexte d'export des données pour mieux sécuriser les paramètres
  const filters = await buildEffectifsFiltersFromRequest(req);

  await createUserEvent({
    type: USER_EVENTS_TYPES.EXPORT_CSV,
    action: getExportAnonymizedEventNameFromFilters(filters),
    username: req.user.email,
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
}
