import type { ObjectId } from "bson";
import {
  COMPTEURS_PURGES_ML,
  type CompteursPurgeMl,
  type TypePurgeMl,
} from "shared/models/data/missionLocaleEffectifsPurgesStats.model";
import type { IMissionLocaleStatsPurges } from "shared/models/data/missionLocaleStatsPurges.model";

import { missionLocaleEffectifsPurgesStatsDb, missionLocaleStatsPurgesDb } from "@/common/model/collections";

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
const FORMAT_HEURE = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" });
const UN_JOUR_MS = 86_400_000;
const UNE_HEURE_MS = 3_600_000;

export const moisParis = (date: Date) => FORMAT_MOIS.format(date);

export const moisUTC = (date: Date) => date.toISOString().slice(0, 7);

export const moisAvant = (finExclue: Date) => {
  const dernierInstant = new Date(finExclue.getTime() - 1);
  return finExclue.getTime() % UN_JOUR_MS === 0 ? moisUTC(dernierInstant) : moisParis(dernierInstant);
};

export const debutDuMois = (mois: string) => {
  const minuitUTC = new Date(`${mois}-01T00:00:00.000Z`);
  return new Date(minuitUTC.getTime() - Number(FORMAT_HEURE.format(minuitUTC)) * UNE_HEURE_MS);
};

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

export const listerCfaPurges = async (
  perimetre: PerimetrePurges = {},
  bornes: BornesMois = {},
  { agesMissionLocale = false }: { agesMissionLocale?: boolean } = {}
) =>
  (
    await missionLocaleEffectifsPurgesStatsDb().distinct("organisme_id", {
      ...buildMatch("collab", perimetre, bornes),
      organisme_id: { $ne: null, ...(perimetre.organismeIds ? { $in: perimetre.organismeIds } : {}) },
      ...(agesMissionLocale ? { "compteurs.ages_ml_envoyes": { $gt: 0 } } : {}),
    })
  ).filter((id): id is ObjectId => id !== null);

type Arbre = { [cle: string]: number | Arbre };

const additionner = (gauche: Arbre, droite: Arbre): Arbre => {
  const somme: Arbre = { ...gauche };
  for (const [cle, valeur] of Object.entries(droite)) {
    const actuelle = somme[cle];
    somme[cle] =
      typeof valeur === "number"
        ? (typeof actuelle === "number" ? actuelle : 0) + valeur
        : additionner(typeof actuelle === "object" ? actuelle : {}, valeur);
  }
  return somme;
};

export const sommerPhotosPurges = async (
  missionLocaleId: ObjectId,
  jour?: Date
): Promise<Pick<IMissionLocaleStatsPurges, "stats" | "segments"> | null> => {
  const documents = await missionLocaleStatsPurgesDb()
    .find(
      { mission_locale_id: missionLocaleId, ...(jour ? { mois: { $lte: moisUTC(jour) } } : {}) },
      { projection: { _id: 0, stats: 1, segments: 1 } }
    )
    .toArray();
  if (documents.length === 0) return null;
  return documents.reduce<Arbre>(
    (somme, { stats, segments }) => additionner(somme, { stats, segments } as unknown as Arbre),
    {}
  ) as unknown as Pick<IMissionLocaleStatsPurges, "stats" | "segments">;
};
