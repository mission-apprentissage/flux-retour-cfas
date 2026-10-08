import type { ObjectId } from "bson";
import { REPONDU_SITUATIONS } from "shared/constants/collaboration";
import { REGIONS_BY_CODE } from "shared/constants/territoires";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { ICollaborationExportResponseSchema } from "shared/models/routes/admin/collaboration-stats.api";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { addDaysUTC, normalizeToUTCDay } from "shared/utils/date";

import { findEligibleOrganismes } from "@/common/actions/organismes/deca-cfa-eligibility";
import { effectifsDb, effectifsDECADb, missionLocaleEffectifsDb } from "@/common/model/collections";

import { buildDossierEnvoyeMatch, fetchActivatedOrganismes } from "./collaboration-stats.actions";

const REGION_NON_RENSEIGNEE = "Non renseigné";

export function formatRegion(code: string | null | undefined): string {
  if (!code) return REGION_NON_RENSEIGNEE;
  return REGIONS_BY_CODE[code as keyof typeof REGIONS_BY_CODE]?.nom ?? REGION_NON_RENSEIGNEE;
}

type CollaborationDetailRow = {
  organisme_id_str: string;
  siret_cfa: string | null;
  nom_cfa: string | null;
  region_cfa: string | null;
  nom_ml: string | null;
  nom_jeune: string | null;
  prenom_jeune: string | null;
  date_naissance_jeune: Date | null;
  statut_apprenant: string | null;
  date_envoi_cfa: Date | null;
  situation: SITUATION_ENUM | null;
  date_traitement_ml: Date | null;
  source: "ERP" | "DECA" | null;
};

async function fetchCollaborationDetails(endExclusive: Date): Promise<CollaborationDetailRow[]> {
  return missionLocaleEffectifsDb()
    .aggregate<CollaborationDetailRow>([
      { $match: buildDossierEnvoyeMatch(endExclusive) },
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
          nom_jeune: { $ifNull: ["$effectif_snapshot.apprenant.nom", null] },
          prenom_jeune: { $ifNull: ["$effectif_snapshot.apprenant.prenom", null] },
          date_naissance_jeune: { $ifNull: ["$effectif_snapshot.apprenant.date_de_naissance", null] },
          statut_apprenant: { $ifNull: ["$effectif_snapshot._computed.statut.en_cours", null] },
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

type CfaWithCollabRow = { siret: string; nom: string | null; region: string; nb_collaborations: number };

function aggregateCfaWithCollab(details: CollaborationDetailRow[]): CfaWithCollabRow[] {
  const byOrg = new Map<string, CfaWithCollabRow>();
  for (const d of details) {
    const current = byOrg.get(d.organisme_id_str) ?? {
      siret: d.siret_cfa ?? "",
      nom: d.nom_cfa,
      region: formatRegion(d.region_cfa),
      nb_collaborations: 0,
    };
    current.nb_collaborations += 1;
    byOrg.set(d.organisme_id_str, current);
  }
  return Array.from(byOrg.values());
}

async function fetchSourcesByOrgId(organismeIds: ObjectId[]): Promise<Map<string, string>> {
  const activeAnnees = getActiveAnneesScolaires(new Date());
  const filter = { organisme_id: { $in: organismeIds }, annee_scolaire: { $in: activeAnnees } };
  const [erpIds, decaIds] = await Promise.all([
    effectifsDb().distinct("organisme_id", filter),
    effectifsDECADb().distinct("organisme_id", filter),
  ]);
  const erp = new Set(erpIds.map((id) => id.toString()));
  const deca = new Set(decaIds.map((id) => id.toString()));

  return new Map(
    organismeIds.map((id) => {
      const parts: string[] = [];
      if (erp.has(id.toString())) parts.push("ERP");
      if (deca.has(id.toString())) parts.push("DECA");
      return [id.toString(), parts.join(", ")];
    })
  );
}

function sortByNom<T extends { nom: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.nom ?? "").localeCompare(b.nom ?? "", "fr"));
}

export async function getCollaborationExportData(): Promise<ICollaborationExportResponseSchema> {
  const endExclusive = addDaysUTC(normalizeToUTCDay(new Date()), 1);

  const [compatibles, activated, details] = await Promise.all([
    findEligibleOrganismes(),
    fetchActivatedOrganismes(endExclusive),
    fetchCollaborationDetails(endExclusive),
  ]);
  const sourcesByOrgId = await fetchSourcesByOrgId(activated.map((o) => o._id));

  const cfa_compatibles = sortByNom(
    compatibles.map((c) => ({ siret: c.siret, nom: c.nom, region: formatRegion(c.region) }))
  );

  const cfa_actives = sortByNom(
    activated.map((o) => ({
      siret: o.siret ?? "",
      nom: o.nom,
      region: formatRegion(o.region),
      date_activation: o.date_activation,
      sources: sourcesByOrgId.get(o._id.toString()) ?? "",
    }))
  );

  const cfa_with_collab = sortByNom(aggregateCfaWithCollab(details));

  const details_collaborations = details
    .map((d) => {
      const traite = d.situation != null;
      const repondu = d.situation != null && REPONDU_SITUATIONS.includes(d.situation);
      const rdv = d.situation === SITUATION_ENUM.RDV_PRIS;
      return {
        siret_cfa: d.siret_cfa,
        nom_cfa: d.nom_cfa,
        region_cfa: formatRegion(d.region_cfa),
        nom_ml: d.nom_ml,
        nom_jeune: d.nom_jeune,
        prenom_jeune: d.prenom_jeune,
        date_naissance_jeune: d.date_naissance_jeune,
        statut_apprenant: d.statut_apprenant,
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
