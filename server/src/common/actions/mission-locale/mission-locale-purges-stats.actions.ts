import type { ObjectId } from "bson";
import {
  COMPTEURS_PURGES_ML,
  type CompteursPurgeMl,
  type TypePurgeMl,
} from "shared/models/data/missionLocaleEffectifsPurgesStats.model";

import { missionLocaleEffectifsPurgesStatsDb } from "@/common/model/collections";

export type PerimetrePurges = {
  regions?: string[];
  departements?: string[];
  missionLocaleIds?: ObjectId[];
  organismeIds?: ObjectId[];
};

export type BornesMois = { depuis?: string; jusqua?: string };

export type LignePurges<T extends TypePurgeMl> = {
  compteurs: CompteursPurgeMl<T>;
  region: string | null;
  departement: string | null;
  premier_mois: string;
  dernier_mois: string;
  cfa_active_le: Date | null;
};

const FORMAT_MOIS = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" });

export const moisParis = (date: Date) => FORMAT_MOIS.format(date);

export const veilleDe = (date: Date) => new Date(date.getTime() - 1);

export const debutDuMois = (mois: string) => new Date(`${mois}-01T00:00:00.000Z`);

const buildMatch = (
  type: TypePurgeMl,
  { regions, departements, missionLocaleIds, organismeIds }: PerimetrePurges,
  { depuis, jusqua }: BornesMois
) => ({
  type,
  ...(regions?.length ? { region: { $in: regions } } : {}),
  ...(departements?.length ? { departement: { $in: departements } } : {}),
  ...(missionLocaleIds ? { mission_locale_id: { $in: missionLocaleIds } } : {}),
  ...(organismeIds ? { organisme_id: { $in: organismeIds } } : {}),
  ...(depuis || jusqua ? { mois: { ...(depuis ? { $gte: depuis } : {}), ...(jusqua ? { $lte: jusqua } : {}) } } : {}),
});

const accumulateurs = (type: TypePurgeMl) =>
  Object.fromEntries(COMPTEURS_PURGES_ML[type].map((champ) => [champ, { $sum: `$compteurs.${champ}` }]));

const extraire = <T extends TypePurgeMl>(type: T, ligne?: Record<string, unknown>) =>
  Object.fromEntries(
    COMPTEURS_PURGES_ML[type].map((champ) => [champ, typeof ligne?.[champ] === "number" ? ligne[champ] : 0])
  ) as CompteursPurgeMl<T>;

export const sommerPurges = async <T extends TypePurgeMl>(
  type: T,
  perimetre: PerimetrePurges = {},
  bornes: BornesMois = {}
): Promise<CompteursPurgeMl<T>> => {
  const [ligne] = await missionLocaleEffectifsPurgesStatsDb()
    .aggregate([{ $match: buildMatch(type, perimetre, bornes) }, { $group: { _id: null, ...accumulateurs(type) } }])
    .toArray();
  return extraire(type, ligne);
};

export const sommerPurgesPar = async <T extends TypePurgeMl>(
  type: T,
  par: "mission_locale_id" | "organisme_id" | "mois",
  perimetre: PerimetrePurges = {},
  bornes: BornesMois = {}
): Promise<Map<string, LignePurges<T>>> => {
  const lignes = await missionLocaleEffectifsPurgesStatsDb()
    .aggregate([
      { $match: buildMatch(type, perimetre, bornes) },
      { $sort: { updated_at: 1 } },
      {
        $group: {
          _id: `$${par}`,
          ...accumulateurs(type),
          region: { $last: "$region" },
          departement: { $last: "$departement" },
          premier_mois: { $min: "$mois" },
          dernier_mois: { $max: "$mois" },
          cfa_active_le: { $min: "$cfa_active_le" },
        },
      },
    ])
    .toArray();
  return new Map(
    lignes
      .filter((ligne) => ligne._id !== null)
      .map((ligne) => [
        ligne._id.toString(),
        {
          compteurs: extraire(type, ligne),
          region: ligne.region ?? null,
          departement: ligne.departement ?? null,
          premier_mois: ligne.premier_mois,
          dernier_mois: ligne.dernier_mois,
          cfa_active_le: ligne.cfa_active_le ?? null,
        },
      ])
  );
};

export const listerCfaPurges = async (perimetre: PerimetrePurges = {}, bornes: BornesMois = {}) =>
  (
    await missionLocaleEffectifsPurgesStatsDb().distinct("organisme_id", {
      ...buildMatch("collab", perimetre, bornes),
      organisme_id: { $ne: null, ...(perimetre.organismeIds ? { $in: perimetre.organismeIds } : {}) },
    })
  ).filter((id): id is ObjectId => id !== null);
