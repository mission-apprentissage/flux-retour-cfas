import { COLLABORATION_CUTOFF_DATE, REPONDU_SITUATIONS } from "shared/constants/collaboration";
import { REGIONS_BY_CODE } from "shared/constants/territoires";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { ICollaborationExportResponseSchema } from "shared/models/routes/admin/collaboration-stats.api";
import { addDaysUTC, normalizeToUTCDay } from "shared/utils/date";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import { fetchCompatibleOrganismes, type ICompatibleOrganisme } from "./collaboration-stats.actions";

const REGION_NON_RENSEIGNEE = "Non renseigné";

function formatRegion(code: string | null | undefined): string {
  if (!code) return REGION_NON_RENSEIGNEE;
  return REGIONS_BY_CODE[code as keyof typeof REGIONS_BY_CODE]?.nom ?? REGION_NON_RENSEIGNEE;
}

type CollaborationDetailRow = {
  organisme_id_str: string;
  siret_cfa: string | null;
  nom_cfa: string | null;
  region_cfa: string | null;
  nom_ml: string | null;
  date_envoi_cfa: Date | null;
  situation: SITUATION_ENUM | null;
  date_traitement_ml: Date | null;
  source: "ERP" | "DECA" | null;
};

async function fetchCollaborationDetails(endExclusive: Date): Promise<CollaborationDetailRow[]> {
  return missionLocaleEffectifsDb()
    .aggregate<CollaborationDetailRow>([
      {
        $match: {
          soft_deleted: { $ne: true },
          "organisme_data.acc_conjoint": true,
          "organisme_data.reponse_at": { $gte: COLLABORATION_CUTOFF_DATE, $lt: endExclusive },
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "effectif_snapshot.organisme_id",
          foreignField: "_id",
          as: "organisme",
          pipeline: [{ $project: { siret: 1, nom: 1, raison_sociale: 1, enseigne: 1, "adresse.region": 1 } }],
        },
      },
      {
        $lookup: {
          from: "organisations",
          localField: "mission_locale_id",
          foreignField: "_id",
          as: "mission_locale",
          pipeline: [{ $project: { nom: 1 } }],
        },
      },
      {
        $lookup: {
          from: "missionLocaleEffectifLog",
          let: { mleId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$mission_locale_effectif_id", "$$mleId"] },
                situation: { $ne: null },
              },
            },
            { $sort: { created_at: 1 } },
            { $limit: 1 },
            { $project: { created_at: 1 } },
          ],
          as: "first_situation_log",
        },
      },
      {
        $project: {
          _id: 0,
          organisme_id_str: { $toString: "$effectif_snapshot.organisme_id" },
          siret_cfa: { $arrayElemAt: ["$organisme.siret", 0] },
          nom_cfa: {
            $ifNull: [
              { $arrayElemAt: ["$organisme.nom", 0] },
              {
                $ifNull: [
                  { $arrayElemAt: ["$organisme.raison_sociale", 0] },
                  { $arrayElemAt: ["$organisme.enseigne", 0] },
                ],
              },
            ],
          },
          region_cfa: {
            $ifNull: [
              { $arrayElemAt: ["$organisme.adresse.region", 0] },
              "$effectif_snapshot._computed.organisme.region",
            ],
          },
          nom_ml: { $arrayElemAt: ["$mission_locale.nom", 0] },
          date_envoi_cfa: "$organisme_data.reponse_at",
          situation: { $ifNull: ["$situation", null] },
          date_traitement_ml: { $arrayElemAt: ["$first_situation_log.created_at", 0] },
          source: {
            $cond: [{ $in: ["$effectif_snapshot.source", ["ERP", "DECA"]] }, "$effectif_snapshot.source", null],
          },
        },
      },
    ])
    .toArray();
}

type UsagePerOrg = { nb_collaborations: number };

function aggregateUsageFromDetails(details: CollaborationDetailRow[]): Map<string, UsagePerOrg> {
  const usage = new Map<string, UsagePerOrg>();
  for (const d of details) {
    const current = usage.get(d.organisme_id_str) ?? { nb_collaborations: 0 };
    current.nb_collaborations += 1;
    usage.set(d.organisme_id_str, current);
  }
  return usage;
}

function formatSources(org: { has_effectifs_erp: boolean; has_effectifs_deca: boolean }): string {
  const parts: string[] = [];
  if (org.has_effectifs_erp) parts.push("ERP");
  if (org.has_effectifs_deca) parts.push("DECA");
  return parts.join(", ");
}

function sortByNom<T extends { nom: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.nom ?? "").localeCompare(b.nom ?? "", "fr"));
}

export async function getCollaborationExportData(): Promise<ICollaborationExportResponseSchema> {
  const endExclusive = addDaysUTC(normalizeToUTCDay(new Date()), 1);

  const [compatibles, details] = await Promise.all([
    fetchCompatibleOrganismes(endExclusive),
    fetchCollaborationDetails(endExclusive),
  ]);

  const compatiblesById = new Map<string, ICompatibleOrganisme>(compatibles.map((c) => [c._id.toString(), c]));
  const usageById = aggregateUsageFromDetails(details);

  const cfa_compatibles = sortByNom(
    compatibles.map((c) => ({ siret: c.siret, nom: c.nom, region: formatRegion(c.region) }))
  );

  const cfa_actives = sortByNom(
    compatibles
      .filter((c): c is ICompatibleOrganisme & { date_activation: Date } => c.date_activation !== null)
      .map((c) => ({
        siret: c.siret,
        nom: c.nom,
        region: formatRegion(c.region),
        date_activation: c.date_activation,
        sources: formatSources(c),
      }))
  );

  const cfa_with_collab = sortByNom(
    Array.from(usageById.entries())
      .filter(([id]) => compatiblesById.has(id))
      .map(([id, u]) => {
        const c = compatiblesById.get(id)!;
        return { siret: c.siret, nom: c.nom, region: formatRegion(c.region), nb_collaborations: u.nb_collaborations };
      })
  );

  const details_collaborations = details
    .filter((d) => compatiblesById.has(d.organisme_id_str))
    .map((d) => {
      const traite = d.situation != null;
      const repondu = d.situation != null && REPONDU_SITUATIONS.includes(d.situation);
      const rdv = d.situation === SITUATION_ENUM.RDV_PRIS;
      return {
        siret_cfa: d.siret_cfa,
        nom_cfa: d.nom_cfa,
        region_cfa: formatRegion(d.region_cfa),
        nom_ml: d.nom_ml,
        dossier_envoye: "Oui" as const,
        date_envoi_cfa: d.date_envoi_cfa,
        dossier_traite: (traite ? "Oui" : "Non") as "Oui" | "Non",
        date_traitement_ml: d.date_traitement_ml,
        reponse_jeune: (repondu ? "Oui" : "Non") as "Oui" | "Non",
        rdv_pris: (rdv ? "Oui" : "Non") as "Oui" | "Non",
        source: d.source,
      };
    })
    .sort((a, b) => (b.date_envoi_cfa?.getTime() ?? 0) - (a.date_envoi_cfa?.getTime() ?? 0));

  return { cfa_compatibles, cfa_actives, cfa_with_collab, details_collaborations };
}
