import { subMonths } from "date-fns";
import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";

import { verifierPerimetreTeleversement } from "@/common/actions/televersement/perimetre.actions";
import parentLogger from "@/common/logger";
import { effectifsQueueDb, organismesDb } from "@/common/model/collections";

const logger = parentLogger.child({ module: "job:tmp:mesurer-perimetre-televersement" });

type ImportFichier = {
  _id: { source_organisme_id: string; jour: string };
  lignes: number;
  etablissements: { uai: string | null; siret: string | null; lignes: number }[];
};

export interface ImportRefuse {
  source_organisme_id: string;
  uai_source: string | null;
  jour: string;
  lignes: number;
  lignes_hors_perimetre: number;
  etablissements_hors_perimetre: string[];
}

export interface BilanMesurePerimetre {
  depuis: string;
  imports: number;
  lignes: number;
  importsRefuses: ImportRefuse[];
  importsNonJuges: { source_organisme_id: string; jour: string }[];
}

export async function mesurerPerimetreTeleversement({ mois = 16 }: { mois?: number } = {}) {
  const depuis = subMonths(new Date(), mois);
  const imports = await effectifsQueueDb()
    .aggregate<ImportFichier>([
      {
        $match: {
          source: SOURCE_APPRENANT.FICHIER,
          created_at: { $gte: depuis },
          source_organisme_id: { $type: "string" },
        },
      },
      {
        $group: {
          _id: {
            source_organisme_id: "$source_organisme_id",
            jour: { $dateToString: { format: "%Y-%m-%d", date: "$created_at", timezone: "Europe/Paris" } },
            uai: "$etablissement_formateur_uai",
            siret: "$etablissement_formateur_siret",
          },
          lignes: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { source_organisme_id: "$_id.source_organisme_id", jour: "$_id.jour" },
          lignes: { $sum: "$lignes" },
          etablissements: { $push: { uai: "$_id.uai", siret: "$_id.siret", lignes: "$lignes" } },
        },
      },
      { $sort: { "_id.jour": 1 } },
    ])
    .toArray();

  const importsRefuses: ImportRefuse[] = [];
  const importsNonJuges: BilanMesurePerimetre["importsNonJuges"] = [];

  for (const importFichier of imports) {
    if (!ObjectId.isValid(importFichier._id.source_organisme_id)) {
      importsNonJuges.push(importFichier._id);
      continue;
    }
    const sourceId = new ObjectId(importFichier._id.source_organisme_id);
    const { indisponible, issues } = await verifierPerimetreTeleversement(
      sourceId,
      importFichier.etablissements.map(({ uai, siret }) => ({
        etablissement_formateur_uai: uai,
        etablissement_formateur_siret: siret,
      }))
    );
    if (indisponible) {
      importsNonJuges.push(importFichier._id);
      continue;
    }
    if (issues.length === 0) {
      continue;
    }
    const horsPerimetre = issues.map(({ path: [index] }) => importFichier.etablissements[index]);
    const source = await organismesDb().findOne({ _id: sourceId }, { projection: { uai: 1 } });
    importsRefuses.push({
      source_organisme_id: importFichier._id.source_organisme_id,
      uai_source: source?.uai ?? null,
      jour: importFichier._id.jour,
      lignes: importFichier.lignes,
      lignes_hors_perimetre: horsPerimetre.reduce((total, { lignes }) => total + lignes, 0),
      etablissements_hors_perimetre: horsPerimetre.map(({ uai, siret }) => `${uai ?? "?"} ${siret ?? "?"}`),
    });
  }

  const bilan: BilanMesurePerimetre = {
    depuis: depuis.toISOString().slice(0, 10),
    imports: imports.length,
    lignes: imports.reduce((total, { lignes }) => total + lignes, 0),
    importsRefuses,
    importsNonJuges,
  };
  logger.info(bilan, "mesure du périmètre de l'import par fichier");
  return bilan;
}
