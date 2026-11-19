import { Collection, Filter, ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { estAnneeScolaireActive, getFinAnneeScolaire } from "shared/utils/anneeScolaire";

import logger from "@/common/logger";
import {
  effectifsArchiveDb,
  effectifsDb,
  effectifsDECADb,
  effectifsPurgesStatsDb,
  voeuxAffelnetDb,
} from "@/common/model/collections";
import { sleep } from "@/common/utils/asyncUtils";
import {
  estHorsConservation,
  getDateLimiteConservation,
  getDatesDeFinEffectif,
  getDatesDeFinEffectifDeca,
} from "@/common/utils/conservationUtils";
import { compterOrganismesSupprimables } from "@/jobs/hydrate/organismes/organisme-cleanup";

const TAILLE_LOT = 1000;
const PAUSE_MS = 200;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 30_000 } as const;

type DossierPurge = {
  _id: ObjectId;
  organisme_id: ObjectId;
  annee_scolaire: string;
  source?: string | null;
  formation?: { date_fin?: Date | null; niveau?: string | null } | null;
  contrats?: Array<{ date_fin?: Date | null; date_rupture?: Date | null }> | null;
  _computed?: {
    organisme?: { uai?: string | null; siret?: string | null } | null;
    statut?: { en_cours?: string | null } | null;
  } | null;
};

type LienVoeu = "effectif_id" | "effectif_deca_id";

type Passe = {
  nom: "effectifs" | "effectifsDECA" | "effectifsArchive";
  collection: () => Collection<DossierPurge>;
  champsDeFin: string[];
  datesDeFin: (dossier: DossierPurge) => Array<Date | null | undefined>;
  source: (dossier: DossierPurge) => string;
  lienVoeu: LienVoeu | null;
  compteurs: boolean;
};

const PASSE_EFFECTIFS: Passe = {
  nom: "effectifs",
  collection: () => effectifsDb() as unknown as Collection<DossierPurge>,
  champsDeFin: ["formation.date_fin", "contrats.date_fin", "contrats.date_rupture"],
  datesDeFin: getDatesDeFinEffectif,
  source: (dossier) => dossier.source ?? SOURCE_APPRENANT.ERP,
  lienVoeu: "effectif_id",
  compteurs: true,
};

const PASSE_DECA: Passe = {
  nom: "effectifsDECA",
  collection: () => effectifsDECADb() as unknown as Collection<DossierPurge>,
  champsDeFin: ["contrats.date_fin"],
  datesDeFin: getDatesDeFinEffectifDeca,
  source: () => SOURCE_APPRENANT.DECA,
  lienVoeu: "effectif_deca_id",
  compteurs: true,
};

const PASSE_ARCHIVE: Passe = {
  ...PASSE_EFFECTIFS,
  nom: "effectifsArchive",
  collection: () => effectifsArchiveDb() as unknown as Collection<DossierPurge>,
  lienVoeu: null,
  compteurs: false,
};

const PROJECTION = {
  _id: 1,
  organisme_id: 1,
  annee_scolaire: 1,
  source: 1,
  "formation.date_fin": 1,
  "formation.niveau": 1,
  "contrats.date_fin": 1,
  "contrats.date_rupture": 1,
  "_computed.organisme.uai": 1,
  "_computed.organisme.siret": 1,
  "_computed.statut.en_cours": 1,
};

type Contexte = {
  dryRun: boolean;
  maintenant: Date;
  limite: Date;
  lancement: Date;
  retiresParOrganisme: Map<string, number>;
  voeuxParEffectif: Map<string, number>;
  voeuxLiesSimules: number;
};

type ParSource = Record<string, number>;

export type ResultatPurgeCollection = { total: number; parAnnee: Record<string, ParSource> };

export type ResultatPurgeEffectifsAnciens = {
  dryRun: boolean;
  limite: Date;
  effectifs: ResultatPurgeCollection;
  effectifsDECA: ResultatPurgeCollection;
  effectifsArchive: ResultatPurgeCollection;
  voeuxDelies: { effectif_id: number; effectif_deca_id: number };
  organismesVides: number;
};

export const filtreHorsConservation = (
  anneeScolaire: string,
  champsDeFin: string[],
  limite: Date
): Filter<DossierPurge> => {
  const filtre: Record<string, unknown> = { annee_scolaire: anneeScolaire };
  for (const champ of champsDeFin) {
    filtre[champ] = { $not: { $gte: limite } };
  }
  const finAnnee = getFinAnneeScolaire(anneeScolaire);
  if (finAnnee === null || finAnnee.getTime() >= limite.getTime()) {
    filtre.$or = champsDeFin.map((champ) => ({ [champ]: { $lt: limite } }));
  }
  return filtre as Filter<DossierPurge>;
};

const dimensions = (passe: Passe, dossier: DossierPurge) => ({
  organisme_id: dossier.organisme_id,
  uai: dossier._computed?.organisme?.uai ?? null,
  siret: dossier._computed?.organisme?.siret ?? null,
  annee_scolaire: dossier.annee_scolaire,
  source: passe.source(dossier),
  statut: dossier._computed?.statut?.en_cours ?? null,
  niveau: dossier.formation?.niveau ?? null,
});

const incrementerCompteurs = async (passe: Passe, supprimes: DossierPurge[]) => {
  const groupes = new Map<string, { filtre: ReturnType<typeof dimensions>; nombre: number }>();
  for (const dossier of supprimes) {
    const filtre = dimensions(passe, dossier);
    const cle = JSON.stringify(filtre);
    const groupe = groupes.get(cle);
    if (groupe) {
      groupe.nombre++;
    } else {
      groupes.set(cle, { filtre, nombre: 1 });
    }
  }
  if (groupes.size === 0) return;

  const maintenant = new Date();
  await effectifsPurgesStatsDb().bulkWrite(
    [...groupes.values()].map(({ filtre, nombre }) => ({
      updateOne: {
        filter: filtre,
        update: { $inc: { nombre }, $set: { updated_at: maintenant } },
        upsert: true,
      },
    })),
    { ordered: false, writeConcern: WRITE_CONCERN }
  );
};

const supprimerLot = async (
  passe: Passe,
  filtre: Filter<DossierPurge>,
  lot: DossierPurge[],
  contexte: Contexte
): Promise<DossierPurge[]> => {
  const candidats = lot.filter((dossier) =>
    estHorsConservation(
      { annee_scolaire: dossier.annee_scolaire, datesDeFin: passe.datesDeFin(dossier) },
      contexte.maintenant
    )
  );
  if (contexte.dryRun) {
    for (const dossier of candidats) {
      contexte.voeuxLiesSimules += contexte.voeuxParEffectif.get(dossier._id.toString()) ?? 0;
    }
  }
  if (contexte.dryRun || candidats.length === 0) return candidats;

  const ids = candidats.map((dossier) => dossier._id);
  let supprimes: DossierPurge[] = [];
  try {
    const { deletedCount } = await passe
      .collection()
      .deleteMany(
        { ...filtre, _id: { $in: ids }, transmitted_at: { $not: { $gt: contexte.lancement } } },
        { writeConcern: WRITE_CONCERN }
      );
    const restants = await passe
      .collection()
      .find({ _id: { $in: ids } }, { projection: { _id: 1 } })
      .toArray();
    const idsRestants = new Set(restants.map((dossier) => dossier._id.toString()));
    supprimes = candidats.filter((dossier) => !idsRestants.has(dossier._id.toString()));
    if (deletedCount !== supprimes.length) {
      logger.warn(
        { collection: passe.nom, deletedCount, absents: supprimes.length },
        "Purge des effectifs anciens : des dossiers du lot ont disparu sans cette purge"
      );
    }
    if (passe.compteurs) await incrementerCompteurs(passe, supprimes);
  } catch (error) {
    logger.error(
      { err: error, collection: passe.nom, candidats: ids.length, supprimes: supprimes.length },
      "Purge des effectifs anciens : lot interrompu, ses compteurs peuvent manquer"
    );
    throw error;
  }
  return supprimes;
};

const purgerAnnee = async (passe: Passe, anneeScolaire: string, contexte: Contexte): Promise<ParSource> => {
  const filtre = filtreHorsConservation(anneeScolaire, passe.champsDeFin, contexte.limite);
  const parSource: ParSource = {};
  let lot: DossierPurge[] = [];

  const traiterLot = async () => {
    const supprimes = await supprimerLot(passe, filtre, lot, contexte);
    for (const dossier of supprimes) {
      const source = passe.source(dossier);
      parSource[source] = (parSource[source] ?? 0) + 1;
      if (passe.compteurs) {
        const organisme = dossier.organisme_id.toString();
        contexte.retiresParOrganisme.set(organisme, (contexte.retiresParOrganisme.get(organisme) ?? 0) + 1);
      }
    }
    lot = [];
    if (!contexte.dryRun && supprimes.length > 0) await sleep(PAUSE_MS);
  };

  const curseur = passe.collection().find(filtre, { projection: PROJECTION, batchSize: TAILLE_LOT });
  for await (const dossier of curseur) {
    lot.push(dossier);
    if (lot.length >= TAILLE_LOT) await traiterLot();
  }
  if (lot.length > 0) await traiterLot();

  return parSource;
};

const compterVoeuxParEffectif = async (lien: LienVoeu): Promise<Map<string, number>> => {
  const liens = await voeuxAffelnetDb()
    .aggregate<{ _id: ObjectId; nombre: number }>([
      { $match: { [lien]: { $type: "objectId" } } },
      { $group: { _id: `$${lien}`, nombre: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(liens.map(({ _id, nombre }) => [_id.toString(), nombre]));
};

const purgerCollection = async (passe: Passe, contexte: Contexte): Promise<ResultatPurgeCollection> => {
  contexte.voeuxLiesSimules = 0;
  contexte.voeuxParEffectif =
    contexte.dryRun && passe.lienVoeu ? await compterVoeuxParEffectif(passe.lienVoeu) : new Map();
  const annees = (await passe.collection().distinct("annee_scolaire")) as string[];
  const resultat: ResultatPurgeCollection = { total: 0, parAnnee: {} };

  for (const anneeScolaire of annees.sort()) {
    if (estAnneeScolaireActive(anneeScolaire, contexte.maintenant)) continue;
    const parSource = await purgerAnnee(passe, anneeScolaire, contexte);
    const total = Object.values(parSource).reduce((somme, nombre) => somme + nombre, 0);
    if (total === 0) continue;
    resultat.parAnnee[anneeScolaire] = parSource;
    resultat.total += total;
    logger.info(
      { collection: passe.nom, annee_scolaire: anneeScolaire, dryRun: contexte.dryRun, ...parSource },
      contexte.dryRun ? "Effectifs anciens à supprimer" : "Effectifs anciens supprimés"
    );
  }

  return resultat;
};

const delierVoeuxOrphelins = async (passe: Passe, dryRun: boolean): Promise<number> => {
  const lien = passe.lienVoeu;
  if (!lien) return 0;
  const orphelins = await voeuxAffelnetDb()
    .aggregate<{ _id: ObjectId; cible: ObjectId }>([
      { $match: { [lien]: { $type: "objectId" } } },
      { $project: { cible: `$${lien}` } },
      {
        $lookup: {
          from: passe.nom,
          localField: "cible",
          foreignField: "_id",
          as: "trouves",
          pipeline: [{ $project: { _id: 1 } }],
        },
      },
      { $match: { trouves: { $size: 0 } } },
      { $project: { cible: 1 } },
    ])
    .toArray();
  if (dryRun || orphelins.length === 0) return orphelins.length;

  let delies = 0;
  for (let debut = 0; debut < orphelins.length; debut += TAILLE_LOT) {
    const resultat = await voeuxAffelnetDb().bulkWrite(
      orphelins.slice(debut, debut + TAILLE_LOT).map(({ _id, cible }) => ({
        updateOne: {
          filter: { _id, [lien]: cible } as Filter<IVoeuAffelnet>,
          update: { $unset: { [lien]: "" } },
        },
      })),
      { ordered: false, writeConcern: WRITE_CONCERN }
    );
    delies += resultat.modifiedCount;
  }
  return delies;
};

export const purgerEffectifsAnciens = async ({
  dryRun = false,
  maintenant = new Date(),
}: { dryRun?: boolean; maintenant?: Date } = {}): Promise<ResultatPurgeEffectifsAnciens> => {
  const lancement = new Date();
  const limite = getDateLimiteConservation(maintenant);
  if (limite.getTime() >= lancement.getTime()) {
    throw new Error(`Purge des effectifs anciens annulée : date limite ${limite.toISOString()} dans le futur`);
  }
  const contexte: Contexte = {
    dryRun,
    maintenant,
    limite,
    lancement,
    retiresParOrganisme: new Map(),
    voeuxParEffectif: new Map(),
    voeuxLiesSimules: 0,
  };

  const effectifs = await purgerCollection(PASSE_EFFECTIFS, contexte);
  const voeuxEffectifs = (await delierVoeuxOrphelins(PASSE_EFFECTIFS, dryRun)) + contexte.voeuxLiesSimules;
  const effectifsDECA = await purgerCollection(PASSE_DECA, contexte);
  const voeuxDeca = (await delierVoeuxOrphelins(PASSE_DECA, dryRun)) + contexte.voeuxLiesSimules;
  const effectifsArchive = await purgerCollection(PASSE_ARCHIVE, contexte);

  const resultat: ResultatPurgeEffectifsAnciens = {
    dryRun,
    limite,
    effectifs,
    effectifsDECA,
    effectifsArchive,
    voeuxDelies: { effectif_id: voeuxEffectifs, effectif_deca_id: voeuxDeca },
    organismesVides: await compterOrganismesSupprimables(
      dryRun
        ? contexte.retiresParOrganisme
        : new Map([...contexte.retiresParOrganisme.keys()].map((organisme) => [organisme, 0]))
    ),
  };
  logger.info(resultat, dryRun ? "Purge des effectifs anciens simulée" : "Purge des effectifs anciens terminée");
  return resultat;
};
