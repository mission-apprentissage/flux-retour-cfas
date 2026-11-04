import type { ObjectId } from "bson";
import {
  RECHERCHE_LONGUEUR_MIN,
  type IRechercheResponse,
  type IRechercheResultat,
  type IRechercheResultatCfa,
  type IRechercheResultatMl,
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";

import { fetchCollaborationsByOrgId } from "@/common/actions/admin/collaborations/collaboration-stats.actions";
import { buildCfaTerritoireMatch, fetchDerniereActiviteByOrgId } from "@/common/actions/cfa/cfa-stats.actions";
import {
  buildLatestPerMlStages,
  buildLatestStatsMatch,
  buildSegmentViewExpr,
} from "@/common/actions/mission-locale/mission-locale-stats.helpers";
import {
  buildAccentInsensitiveRegex,
  buildOrganismeSearchFilter,
} from "@/common/actions/organismes/organismes.actions";
import {
  missionLocaleCfaInvitationsDb,
  missionLocaleStatsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";

type Candidat = { type: "cfa" | "ml"; id: ObjectId; nom: string | null };

const collator = new Intl.Collator("fr", { sensitivity: "base" });

// Départage sur le type puis l'id : l'ordre doit être stable d'une page à l'autre
const compareCandidats = (a: Candidat, b: Candidat) => {
  if (a.nom !== b.nom) {
    if (!a.nom || !b.nom) return a.nom ? -1 : 1;
    const parNom = collator.compare(a.nom, b.nom);
    if (parNom) return parNom;
  }
  return a.type.localeCompare(b.type) || a.id.toString().localeCompare(b.id.toString());
};

const findCfa = (recherche: string, regions?: string[]) =>
  organismesDb()
    .find(
      { $and: [buildCfaTerritoireMatch({ regions }), buildOrganismeSearchFilter(recherche)] },
      {
        projection: {
          enseigne: 1,
          raison_sociale: 1,
          uai: 1,
          siret: 1,
          has_account: 1,
          "adresse.code_postal": 1,
          "adresse.commune": 1,
          "adresse.complete": 1,
        },
      }
    )
    .toArray();

const findMissionsLocales = (recherche: string, regions?: string[]) =>
  organisationsDb()
    .find(
      {
        type: "MISSION_LOCALE",
        ...(regions?.length ? { "adresse.region": { $in: regions } } : {}),
        $and: recherche
          .split(/\s+/)
          .filter(Boolean)
          .map((mot) => {
            const regex = { $regex: buildAccentInsensitiveRegex(mot), $options: "i" };
            return { $or: [{ nom: regex }, { "adresse.commune": regex }, { siret: regex }] };
          }),
      },
      { projection: { nom: 1, adresse: 1, activated_at: 1, derniere_activite: 1 } }
    )
    .toArray();

const countInvitationsByOrgId = async (organismeIds: ObjectId[]) => {
  if (organismeIds.length === 0) return new Map<string, number>();
  const rows = await missionLocaleCfaInvitationsDb()
    .aggregate<{ _id: ObjectId; n: number }>([
      { $match: { organisme_id: { $in: organismeIds } } },
      { $group: { _id: "$organisme_id", n: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(rows.map((row) => [row._id.toString(), row.n]));
};

type Seg = { a_traiter?: number; traite?: number };

const fetchMlStatsById = async (missionLocaleIds: ObjectId[]) => {
  if (missionLocaleIds.length === 0) return new Map<string, { rupture: Seg; collab: Seg }>();
  const rows = await missionLocaleStatsDb()
    .aggregate<{ _id: ObjectId; rupture: Seg; collab: Seg }>([
      ...buildLatestPerMlStages(buildLatestStatsMatch(normalizeToUTCDay(new Date()), missionLocaleIds)),
      { $project: { rupture: buildSegmentViewExpr("rupture"), collab: buildSegmentViewExpr("collab") } },
    ])
    .toArray();
  return new Map(rows.map((row) => [row._id.toString(), { rupture: row.rupture, collab: row.collab }]));
};
/** Recherche mixte d'établissements (CFA du référentiel et Missions Locales) par nom ou commune, sur un territoire. */
export async function rechercherEtablissements(
  recherche: string,
  regions: string[] | undefined,
  { page, limit }: { page: number; limit: number }
): Promise<IRechercheResponse> {
  const terme = recherche.trim();
  if (terme.length < RECHERCHE_LONGUEUR_MIN) {
    return { total: 0, pagination: { page, limit, total_pages: 0 }, data: [] };
  }

  const [cfas, missionsLocales] = await Promise.all([findCfa(terme, regions), findMissionsLocales(terme, regions)]);
  const cfaById = new Map(cfas.map((cfa) => [cfa._id.toString(), cfa]));
  const mlById = new Map(missionsLocales.map((ml) => [ml._id.toString(), ml]));

  // Tri et pagination d'abord : seuls les résultats affichés sont enrichis de leurs indicateurs.
  const candidats: Candidat[] = [
    ...cfas.map((cfa) => ({
      type: "cfa" as const,
      id: cfa._id,
      nom: (cfa.enseigne || cfa.raison_sociale)?.trim() || null,
    })),
    ...missionsLocales.map((ml) => ({ type: "ml" as const, id: ml._id, nom: (ml as { nom?: string }).nom ?? null })),
  ].sort(compareCandidats);
  const pageCandidats = candidats.slice((page - 1) * limit, page * limit);

  const pageCfaIds = pageCandidats.filter((c) => c.type === "cfa").map((c) => c.id);
  const pageMlIds = pageCandidats.filter((c) => c.type === "ml").map((c) => c.id);
  const [invitations, collaborations, connexions, mlStats] = await Promise.all([
    countInvitationsByOrgId(pageCfaIds),
    fetchCollaborationsByOrgId(pageCfaIds, new Date(), null),
    fetchDerniereActiviteByOrgId(pageCfaIds),
    fetchMlStatsById(pageMlIds),
  ]);

  const data = pageCandidats.map((candidat): IRechercheResultat => {
    const id = candidat.id.toString();
    if (candidat.type === "cfa") {
      const cfa = cfaById.get(id)!;
      const resultat: IRechercheResultatCfa = {
        type: "cfa",
        id,
        nom: candidat.nom,
        adresse: {
          code_postal: cfa.adresse?.code_postal ?? null,
          commune: cfa.adresse?.commune ?? null,
          complete: cfa.adresse?.complete ?? null,
        },
        uai: cfa.uai ?? null,
        siret: cfa.siret,
        compte_tba: cfa.has_account === true,
        invitations_recues: invitations.get(id) ?? 0,
        collaborations_envoyees: collaborations.get(id)?.nb ?? 0,
        derniere_activite: connexions.get(id) ?? null,
      };
      return resultat;
    }
    const ml = mlById.get(id)! as {
      adresse?: { code_postal?: string; commune?: string };
      activated_at?: Date;
      derniere_activite?: Date;
    };
    const stats = mlStats.get(id);
    const resultat: IRechercheResultatMl = {
      type: "ml",
      id,
      nom: candidat.nom,
      adresse: { code_postal: ml.adresse?.code_postal ?? null, commune: ml.adresse?.commune ?? null, complete: null },
      compte_tba: !!ml.activated_at,
      ruptures: { a_traiter: stats?.rupture.a_traiter ?? 0, traites: stats?.rupture.traite ?? 0 },
      collaborations: {
        recues: (stats?.collab.a_traiter ?? 0) + (stats?.collab.traite ?? 0),
        traitees: stats?.collab.traite ?? 0,
      },
      derniere_activite: ml.derniere_activite ?? null,
    };
    return resultat;
  });

  return {
    total: candidats.length,
    pagination: { page, limit, total_pages: Math.ceil(candidats.length / limit) },
    data,
  };
}
