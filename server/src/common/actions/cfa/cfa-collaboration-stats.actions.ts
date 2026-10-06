import type { ObjectId } from "bson";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { CfaInjoignablesSortBy, ICfaInjoignablesRow, ICfaNpsStats } from "shared/models/data/nationalStats.model";

import { buildDossierEnvoyeMatch } from "@/common/actions/admin/collaborations/collaboration-stats.actions";
import { missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";

import { buildCfaTerritoireMatch, type CfaTerritoire } from "./cfa-stats.actions";

export const SEUIL_TAUX_INJOIGNABLES = 25;
export const MIN_DOSSIERS_TRAITES_INJOIGNABLES = 4;

const INJOIGNABLE_SITUATIONS = [SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES, SITUATION_ENUM.COORDONNEES_INCORRECT];

const findTerritoireOrganismes = (territoire: CfaTerritoire) =>
  organismesDb()
    .find(buildCfaTerritoireMatch(territoire), {
      projection: { _id: 1, enseigne: 1, raison_sociale: 1, uai: 1, siret: 1, adresse: 1 },
    })
    .toArray();

/**
 * NPS adapté à la note de fin de formulaire de collaboration (0 à 5, « facilité du formulaire ») :
 * 5 = promoteur, 4 = passif, 0 à 3 = détracteur. Méthode provisoire, à valider avec le métier.
 */
export async function getCfaNpsStats(territoire: CfaTerritoire): Promise<ICfaNpsStats> {
  const organismeIds = (await findTerritoireOrganismes(territoire)).map((organisme) => organisme._id);
  if (organismeIds.length === 0) return { nps: null, total_reponses: 0, utilisateurs: 0, cfa: 0 };

  const [result] = await missionLocaleEffectifsDb()
    .aggregate<{ total: number; promoteurs: number; detracteurs: number; utilisateurs: unknown[]; cfa: unknown[] }>([
      {
        $match: {
          ...buildDossierEnvoyeMatch(new Date(), organismeIds),
          "organisme_data.form_feedback.note": { $type: "number" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          promoteurs: { $sum: { $cond: [{ $eq: ["$organisme_data.form_feedback.note", 5] }, 1, 0] } },
          detracteurs: { $sum: { $cond: [{ $lte: ["$organisme_data.form_feedback.note", 3] }, 1, 0] } },
          utilisateurs: { $addToSet: "$organisme_data.acc_conjoint_by" },
          cfa: { $addToSet: "$effectif_snapshot.organisme_id" },
        },
      },
    ])
    .toArray();

  if (!result?.total) return { nps: null, total_reponses: 0, utilisateurs: 0, cfa: 0 };

  return {
    nps: Math.round(((result.promoteurs - result.detracteurs) / result.total) * 100),
    total_reponses: result.total,
    utilisateurs: result.utilisateurs.filter(Boolean).length,
    cfa: result.cfa.length,
  };
}

const compareText = (a: string | null | undefined, b: string | null | undefined) => {
  if (!a || !b) return a === b ? 0 : a ? -1 : 1;
  return a.localeCompare(b, "fr", { sensitivity: "base" });
};

const INJOIGNABLES_COMPARATORS: Record<
  CfaInjoignablesSortBy,
  (a: ICfaInjoignablesRow, b: ICfaInjoignablesRow) => number
> = {
  nom: (a, b) => compareText(a.nom, b.nom),
  localisation: (a, b) => compareText(a.adresse?.commune, b.adresse?.commune),
  taux: (a, b) => a.taux - b.taux,
};

/** CFA du territoire dont plus de 25 % des dossiers traités par la ML aboutissent à un jeune injoignable. */
export async function listCfaInjoignables(
  territoire: CfaTerritoire,
  { sort_by, sort_order }: { sort_by: CfaInjoignablesSortBy; sort_order: "asc" | "desc" }
): Promise<ICfaInjoignablesRow[]> {
  const organismes = await findTerritoireOrganismes(territoire);
  if (organismes.length === 0) return [];

  const counts = await missionLocaleEffectifsDb()
    .aggregate<{ _id: ObjectId; traites: number; injoignables: number }>([
      {
        $match: {
          ...buildDossierEnvoyeMatch(
            new Date(),
            organismes.map((organisme) => organisme._id)
          ),
          situation: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$effectif_snapshot.organisme_id",
          traites: { $sum: 1 },
          injoignables: { $sum: { $cond: [{ $in: ["$situation", INJOIGNABLE_SITUATIONS] }, 1, 0] } },
        },
      },
      { $match: { traites: { $gte: MIN_DOSSIERS_TRAITES_INJOIGNABLES } } },
    ])
    .toArray();

  const organismesById = new Map(organismes.map((organisme) => [organisme._id.toString(), organisme]));
  const rows = counts.flatMap((count): ICfaInjoignablesRow[] => {
    const taux = Math.round((count.injoignables / count.traites) * 100);
    const organisme = organismesById.get(count._id.toString());
    if (!organisme || count.injoignables * 100 <= count.traites * SEUIL_TAUX_INJOIGNABLES) return [];
    return [
      {
        organisme_id: count._id.toString(),
        nom: (organisme.enseigne || organisme.raison_sociale)?.trim() || null,
        uai: organisme.uai ?? null,
        siret: organisme.siret,
        adresse: organisme.adresse
          ? {
              code_postal: organisme.adresse.code_postal,
              commune: organisme.adresse.commune,
              complete: organisme.adresse.complete,
            }
          : null,
        traites: count.traites,
        injoignables: count.injoignables,
        taux,
      },
    ];
  });

  const direction = sort_order === "asc" ? 1 : -1;
  return rows.sort((a, b) => INJOIGNABLES_COMPARATORS[sort_by](a, b) * direction || compareText(a.nom, b.nom));
}
