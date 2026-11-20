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

import { executerPurgeDossiersMlMasques, type ResultatPurgeDossiersMasques } from "./purge-ml-dossiers-masques";
import { ventiler, type Ventilation } from "./ventilation";

const TAILLE_LOT = 1000;
const PAUSE_MS = 200;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 30_000 } as const;

type DossierSuivi = {
  _id: ObjectId;
  effectif_snapshot?: { annee_scolaire?: string | null; source?: string | null } | null;
};

type Contexte = { dryRun: boolean; maintenant: Date; dejaComptes?: Set<string> };

type Lies = {
  compter: (ids: ObjectId[]) => Promise<number>;
  supprimer: (ids: ObjectId[]) => Promise<number>;
};

export type ResultatPurgeSuivi = {
  supprimes: number;
  gardesAnneeActive: number;
  liesSupprimes: number;
  parAnnee: Ventilation;
};

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
  { dryRun, maintenant, dejaComptes }: Contexte,
  lies?: Lies
): Promise<ResultatPurgeSuivi> => {
  const resultat: ResultatPurgeSuivi = { supprimes: 0, gardesAnneeActive: 0, liesSupprimes: 0, parAnnee: {} };
  let lot: DossierSuivi[] = [];

  const compterSupprimes = (dossiers: DossierSuivi[]) => {
    resultat.supprimes += dossiers.length;
    for (const dossier of dossiers) {
      ventiler(resultat.parAnnee, dossier.effectif_snapshot?.annee_scolaire, dossier.effectif_snapshot?.source);
    }
  };

  const traiterLot = async () => {
    const aSupprimer: DossierSuivi[] = [];
    for (const dossier of lot) {
      if (dejaComptes?.has(dossier._id.toString())) continue;
      if (estAnneeScolaireActive(dossier.effectif_snapshot?.annee_scolaire ?? "", maintenant)) {
        resultat.gardesAnneeActive++;
      } else {
        aSupprimer.push(dossier);
      }
    }
    lot = [];
    if (aSupprimer.length === 0) return;
    const ids = aSupprimer.map(({ _id }) => _id);

    if (dryRun) {
      compterSupprimes(aSupprimer);
      resultat.liesSupprimes += lies ? await lies.compter(ids) : 0;
      return;
    }

    await collection.deleteMany({ ...filtre, _id: { $in: ids } }, { writeConcern: WRITE_CONCERN });
    const restants = await collection.find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray();
    const idsRestants = new Set(restants.map(({ _id }) => _id.toString()));
    const supprimes = aSupprimer.filter(({ _id }) => !idsRestants.has(_id.toString()));
    compterSupprimes(supprimes);
    if (supprimes.length > 0) {
      resultat.liesSupprimes += lies ? await lies.supprimer(supprimes.map(({ _id }) => _id)) : 0;
      await sleep(PAUSE_MS);
    }
  };

  const curseur = collection.find(filtre, {
    projection: { _id: 1, "effectif_snapshot.annee_scolaire": 1, "effectif_snapshot.source": 1 },
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

  const { resultat: dossiersMasques, idsSupprimes } = await executerPurgeDossiersMlMasques({ dryRun, maintenant });
  const missionLocale = await purgerParLots(
    missionLocaleEffectifsDb() as unknown as Collection<DossierSuivi>,
    filtreDossierMlAncien(limite),
    { ...contexte, dejaComptes: dryRun ? idsSupprimes : undefined },
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
