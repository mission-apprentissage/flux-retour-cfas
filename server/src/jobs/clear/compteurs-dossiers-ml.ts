import type { ObjectId } from "mongodb";
import type { IOrganisationMissionLocale } from "shared/models";
import type { IMissionLocaleStats, IMissionLocaleStatsSegments } from "shared/models/data/missionLocaleStats.model";

import { computeMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale.actions";
import logger from "@/common/logger";
import { missionLocaleStatsPurgesDb, organisationsDb } from "@/common/model/collections";

export type DossierMlACompter = { _id: ObjectId; mission_locale_id: ObjectId };

type Increments = Record<string, number>;

export type ContributionsLot = {
  photos: Map<string, { missionLocaleId: ObjectId; increments: Increments }>;
};

type Photo = { stats: IMissionLocaleStats["stats"]; segments: IMissionLocaleStatsSegments };

const prefixer = (prefixe: string, compteurs: Record<string, number>): Increments =>
  Object.fromEntries(Object.entries(compteurs).map(([champ, valeur]) => [`${prefixe}.${champ}`, valeur]));

const aplatir = ({ stats, segments }: Photo): Increments => ({
  ...prefixer("stats", stats),
  ...prefixer("segments.rupture", segments.rupture),
  ...prefixer("segments.collab", segments.collab),
});

const grouperParMl = (dossiers: DossierMlACompter[]) => {
  const groupes = new Map<string, { missionLocaleId: ObjectId; ids: ObjectId[] }>();
  for (const { _id, mission_locale_id } of dossiers) {
    const cle = mission_locale_id.toString();
    const groupe = groupes.get(cle);
    if (groupe) {
      groupe.ids.push(_id);
    } else {
      groupes.set(cle, { missionLocaleId: mission_locale_id, ids: [_id] });
    }
  }
  return groupes;
};

const calculerPhotos = async (dossiers: DossierMlACompter[]): Promise<ContributionsLot["photos"]> => {
  const photos: ContributionsLot["photos"] = new Map();
  for (const [cle, { missionLocaleId, ids }] of grouperParMl(dossiers)) {
    const organisation = await organisationsDb().findOne({ _id: missionLocaleId, type: "MISSION_LOCALE" });
    if (!organisation) {
      logger.warn(
        { mission_locale_id: missionLocaleId, dossiers: ids.length },
        "Purge des dossiers de suivi : mission locale introuvable, dossiers absents des photos"
      );
      continue;
    }
    const photo = await computeMissionLocaleStats(organisation as IOrganisationMissionLocale, new Date(), ids);
    photos.set(cle, { missionLocaleId, increments: aplatir(photo) });
  }
  return photos;
};

export const calculerContributions = async (dossiers: DossierMlACompter[]): Promise<ContributionsLot> => ({
  photos: await calculerPhotos(dossiers),
});

export const retirerRestants = async (
  contributions: ContributionsLot,
  restants: DossierMlACompter[]
): Promise<ContributionsLot> => {
  for (const [cle, restant] of await calculerPhotos(restants)) {
    const photo = contributions.photos.get(cle);
    if (!photo) continue;
    for (const [champ, valeur] of Object.entries(restant.increments)) {
      photo.increments[champ] = (photo.increments[champ] ?? 0) - valeur;
    }
  }
  return contributions;
};

export const ecrireContributions = async (
  contributions: ContributionsLot,
  writeConcern: { w: "majority"; wtimeoutMS: number }
) => {
  const maintenant = new Date();
  const operations = [...contributions.photos.values()]
    .filter(({ increments }) => Object.values(increments).some((valeur) => valeur !== 0))
    .map(({ missionLocaleId, increments }) => ({
      updateOne: {
        filter: { mission_locale_id: missionLocaleId },
        update: { $inc: increments, $set: { updated_at: maintenant } },
        upsert: true,
      },
    }));
  if (operations.length === 0) return;
  await missionLocaleStatsPurgesDb().bulkWrite(operations, { ordered: false, writeConcern });
};
