import { Collection, Filter, ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { estAnneeScolaireActive } from "shared/utils/anneeScolaire";

import logger from "@/common/logger";
import {
  franceTravailEffectifsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
} from "@/common/model/collections";
import { sleep } from "@/common/utils/asyncUtils";
import { getDateLimiteConservation } from "@/common/utils/conservationUtils";

import { purgerDossiersMlMasques, type ResultatPurgeDossiersMasques } from "./purge-ml-dossiers-masques";

const TAILLE_LOT = 1000;
const PAUSE_MS = 200;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 30_000 } as const;

type DossierSuivi = { _id: ObjectId; effectif_snapshot?: { annee_scolaire?: string | null } | null };

type Contexte = { dryRun: boolean; maintenant: Date };

type Lies = {
  compter: (ids: ObjectId[]) => Promise<number>;
  supprimer: (ids: ObjectId[]) => Promise<number>;
};

export type ResultatPurgeSuivi = { supprimes: number; gardesAnneeActive: number; liesSupprimes: number };

export type ResultatPurgeDossiersSuivi = {
  dryRun: boolean;
  limite: Date;
  dossiersMasques: ResultatPurgeDossiersMasques;
  missionLocale: ResultatPurgeSuivi;
  franceTravail: ResultatPurgeSuivi;
};

const filtreDossierMlAncien = (limite: Date) =>
  ({
    date_rupture: { $not: { $gte: limite } },
    "cfa_rupture_declaration.date_rupture": { $not: { $gte: limite } },
    $nor: [{ "current_status.value": STATUT_APPRENANT.RUPTURANT, "current_status.date": { $gte: limite } }],
    $or: [
      { date_rupture: { $lt: limite } },
      { "cfa_rupture_declaration.date_rupture": { $lt: limite } },
      { "current_status.value": STATUT_APPRENANT.RUPTURANT, "current_status.date": { $lt: limite } },
      { created_at: { $lt: limite } },
    ],
  }) as unknown as Filter<DossierSuivi>;

const LOGS_ML: Lies = {
  compter: (ids) => missionLocaleEffectifsLogDb().countDocuments({ mission_locale_effectif_id: { $in: ids } }),
  supprimer: async (ids) =>
    (
      await missionLocaleEffectifsLogDb().deleteMany(
        { mission_locale_effectif_id: { $in: ids } },
        { writeConcern: WRITE_CONCERN }
      )
    ).deletedCount,
};

const purgerParLots = async (
  collection: Collection<DossierSuivi>,
  filtre: Filter<DossierSuivi>,
  { dryRun, maintenant }: Contexte,
  lies?: Lies
): Promise<ResultatPurgeSuivi> => {
  const resultat: ResultatPurgeSuivi = { supprimes: 0, gardesAnneeActive: 0, liesSupprimes: 0 };
  let lot: DossierSuivi[] = [];

  const traiterLot = async () => {
    const ids: ObjectId[] = [];
    for (const dossier of lot) {
      if (estAnneeScolaireActive(dossier.effectif_snapshot?.annee_scolaire ?? "", maintenant)) {
        resultat.gardesAnneeActive++;
      } else {
        ids.push(dossier._id);
      }
    }
    lot = [];
    if (ids.length === 0) return;

    if (dryRun) {
      resultat.supprimes += ids.length;
      resultat.liesSupprimes += lies ? await lies.compter(ids) : 0;
      return;
    }

    await collection.deleteMany({ ...filtre, _id: { $in: ids } }, { writeConcern: WRITE_CONCERN });
    const restants = await collection.find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray();
    const idsRestants = new Set(restants.map(({ _id }) => _id.toString()));
    const supprimes = ids.filter((id) => !idsRestants.has(id.toString()));
    resultat.supprimes += supprimes.length;
    if (supprimes.length > 0) {
      resultat.liesSupprimes += lies ? await lies.supprimer(supprimes) : 0;
      await sleep(PAUSE_MS);
    }
  };

  const curseur = collection.find(filtre, {
    projection: { _id: 1, "effectif_snapshot.annee_scolaire": 1 },
    batchSize: TAILLE_LOT,
  });
  for await (const dossier of curseur) {
    lot.push(dossier);
    if (lot.length >= TAILLE_LOT) await traiterLot();
  }
  if (lot.length > 0) await traiterLot();

  return resultat;
};

export const purgerDossiersSuivi = async ({
  dryRun = false,
  maintenant = new Date(),
}: { dryRun?: boolean; maintenant?: Date } = {}): Promise<ResultatPurgeDossiersSuivi> => {
  const limite = getDateLimiteConservation(maintenant);
  if (limite.getTime() >= Date.now()) {
    throw new Error(`Purge des dossiers de suivi annulée : date limite ${limite.toISOString()} dans le futur`);
  }
  const contexte: Contexte = { dryRun, maintenant };

  const dossiersMasques = await purgerDossiersMlMasques({ dryRun });
  const missionLocale = await purgerParLots(
    missionLocaleEffectifsDb() as unknown as Collection<DossierSuivi>,
    filtreDossierMlAncien(limite),
    contexte,
    LOGS_ML
  );
  const franceTravail = await purgerParLots(
    franceTravailEffectifsDb() as unknown as Collection<DossierSuivi>,
    { created_at: { $lt: limite } } as Filter<DossierSuivi>,
    contexte
  );

  const resultat: ResultatPurgeDossiersSuivi = { dryRun, limite, dossiersMasques, missionLocale, franceTravail };
  logger.info(resultat, dryRun ? "Purge des dossiers de suivi simulée" : "Purge des dossiers de suivi terminée");
  return resultat;
};
