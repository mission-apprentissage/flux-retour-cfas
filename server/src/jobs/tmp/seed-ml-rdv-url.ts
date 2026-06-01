import { readFileSync } from "node:fs";

import { parse } from "csv-parse/sync";
import { httpUrlSchema } from "shared/models/data/organisations.model";

import parentLogger from "@/common/logger";
import { organisationsDb } from "@/common/model/collections";

const logger = parentLogger.child({ module: "job:tmp:seed-ml-rdv-url" });

interface Options {
  csvPath: string;
  dryRun: boolean;
}

interface CsvRow {
  siret?: string;
  rdv_url?: string;
  matched_nom_mongo?: string;
}

interface Report {
  totalRows: number;
  updated: number;
  notFound: number;
  skipped: number;
  invalidUrl: number;
  ambiguousSiret: number;
}

export async function seedMlRdvUrl({ csvPath, dryRun }: Options): Promise<number> {
  logger.info({ csvPath, dryRun }, "Début du seed ml rdv_url");

  const raw = readFileSync(csvPath, "utf8");
  const rows: CsvRow[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  const report: Report = {
    totalRows: rows.length,
    updated: 0,
    notFound: 0,
    skipped: 0,
    invalidUrl: 0,
    ambiguousSiret: 0,
  };

  for (const row of rows) {
    if (!row.siret || !row.rdv_url) {
      report.skipped++;
      continue;
    }

    // Validation URL : sans ce filtre, une URL malformée serait envoyée telle quelle
    // dans le template Brevo → lien cassé côté jeune.
    const parsed = httpUrlSchema.safeParse(row.rdv_url);
    if (!parsed.success) {
      logger.warn(
        { siret: row.siret, rdv_url: row.rdv_url, error: parsed.error.issues[0]?.message },
        "rdv_url invalide (non http(s) ou malformée) — seed skippé"
      );
      report.invalidUrl++;
      continue;
    }

    const matches = await organisationsDb()
      .find({ type: "MISSION_LOCALE", siret: row.siret }, { projection: { _id: 1, nom: 1 } })
      .toArray();

    if (matches.length === 0) {
      report.notFound++;
      continue;
    }

    if (matches.length > 1) {
      logger.warn(
        {
          siret: row.siret,
          matchedIds: matches.map((m) => m._id.toString()),
          matchedNoms: matches.map((m) => (m as { nom?: string }).nom),
        },
        "Plusieurs ML matchent ce SIRET — seed skippé (résolution manuelle requise)"
      );
      report.ambiguousSiret++;
      continue;
    }

    if (dryRun) {
      report.updated++;
      continue;
    }

    await organisationsDb().updateOne({ _id: matches[0]._id }, { $set: { rdv_url: parsed.data } });
    report.updated++;
  }

  logger.info(report, dryRun ? "Seed ml rdv_url simulé (dry-run)" : "Seed ml rdv_url terminé");
  return 0;
}
