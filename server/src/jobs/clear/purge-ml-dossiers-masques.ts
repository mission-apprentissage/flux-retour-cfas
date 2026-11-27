import { Filter, ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import type { IEffectifComputedStatut } from "shared/models/data/effectifs.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";

import { getCurrentStatutFromParcours } from "@/common/actions/shared/rupture-pipeline.utils";
import logger from "@/common/logger";
import { effectifsDb, missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";
import { sleep } from "@/common/utils/asyncUtils";

import { ventiler, type Ventilation } from "./ventilation";

const TAILLE_LOT = 1000;
const PAUSE_MS = 200;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 30_000 } as const;

const FILTRE_DOSSIER_MASQUE_SANS_TRACE = {
  soft_deleted: true,
  whatsapp_contact: null,
  situation: null,
  commentaires: null,
  situation_autre: null,
  deja_connu: null,
  connaissance_ml: null,
  probleme_type: null,
  probleme_detail: null,
  date_traitement: null,
  date_dernier_passage_a_recontacter: null,
  a_traiter: null,
  injoignable: null,
  nouveau_contrat: null,
  souhaite_rdv: { $ne: true },
  whatsapp_callback_requested: { $ne: true },
  whatsapp_no_help_responded: { $ne: true },
  effectif_choice: null,
  deca_feedback: null,
  "classification_reponse_appel.feedback": null,
  "organisme_data.reponse_at": null,
  "organisme_data.acc_conjoint": { $ne: true },
  "organisme_data.acc_conjoint_by": null,
  cfa_rupture_declaration: null,
} as unknown as Filter<IMissionLocaleEffectif>;

const CHAMPS_LOG = [
  "situation",
  "situation_autre",
  "deja_connu",
  "connaissance_ml",
  "commentaires",
  "probleme_type",
  "probleme_detail",
  "event",
  "created_by",
] as const;

const FILTRE_LOG_NON_VIDE = {
  $or: CHAMPS_LOG.map((champ) => ({ [champ]: { $ne: null } })),
} as Filter<IMissionLocaleEffectifLog>;

type DossierMasque = Pick<IMissionLocaleEffectif, "_id" | "effectif_id"> & {
  identifiant_normalise?: { nom?: string } | null;
  effectif_snapshot?: { annee_scolaire?: string | null; source?: string | null } | null;
};

export type ResultatPurgeDossiersMasques = {
  dryRun: boolean;
  candidats: number;
  gardes: { rupturant: number; log: number };
  supprimes: number;
  avecIdentite: number;
  logsSupprimes: number;
  parAnnee: Ventilation;
};

const idsRupturants = async (dossiers: DossierMasque[], maintenant: Date): Promise<Set<string>> => {
  const effectifIds = dossiers.map(({ effectif_id }) => effectif_id);
  const lignes = await effectifsDb()
    .aggregate<{ _id: ObjectId; parcours?: IEffectifComputedStatut["parcours"] }>([
      { $match: { _id: { $in: effectifIds } } },
      { $unionWith: { coll: "effectifsDECA", pipeline: [{ $match: { _id: { $in: effectifIds } } }] } },
      { $project: { parcours: "$_computed.statut.parcours" } },
    ])
    .toArray();

  const parcoursParEffectif = new Map<string, IEffectifComputedStatut["parcours"] | undefined>();
  for (const { _id, parcours } of lignes) {
    if (!parcoursParEffectif.has(_id.toString())) {
      parcoursParEffectif.set(_id.toString(), parcours);
    }
  }

  const rupturants = new Set<string>();
  for (const [effectifId, parcours] of parcoursParEffectif) {
    if (getCurrentStatutFromParcours(parcours, maintenant)?.valeur === STATUT_APPRENANT.RUPTURANT) {
      rupturants.add(effectifId);
    }
  }
  return rupturants;
};

const idsAvecLogNonVide = async (dossiers: DossierMasque[]): Promise<Set<string>> => {
  const ids = await missionLocaleEffectifsLogDb().distinct("mission_locale_effectif_id", {
    mission_locale_effectif_id: { $in: dossiers.map(({ _id }) => _id) },
    ...FILTRE_LOG_NON_VIDE,
  });
  return new Set(ids.map((id) => id.toString()));
};

export const executerPurgeDossiersMlMasques = async ({
  dryRun = false,
  maintenant = new Date(),
}: { dryRun?: boolean; maintenant?: Date } = {}): Promise<{
  resultat: ResultatPurgeDossiersMasques;
  idsSupprimes: Set<string>;
}> => {
  const resultat: ResultatPurgeDossiersMasques = {
    dryRun,
    candidats: 0,
    gardes: { rupturant: 0, log: 0 },
    supprimes: 0,
    avecIdentite: 0,
    logsSupprimes: 0,
    parAnnee: {},
  };
  const idsSupprimes = new Set<string>();
  let lot: DossierMasque[] = [];

  const compterSupprimes = (dossiers: DossierMasque[]) => {
    for (const dossier of dossiers) {
      idsSupprimes.add(dossier._id.toString());
      resultat.supprimes++;
      if (dossier.identifiant_normalise?.nom) resultat.avecIdentite++;
      ventiler(resultat.parAnnee, dossier.effectif_snapshot?.annee_scolaire, dossier.effectif_snapshot?.source);
    }
  };

  const traiterLot = async () => {
    resultat.candidats += lot.length;
    const rupturants = await idsRupturants(lot, maintenant);
    const avecLog = await idsAvecLogNonVide(lot);
    const aSupprimer: DossierMasque[] = [];
    for (const dossier of lot) {
      if (rupturants.has(dossier.effectif_id.toString())) {
        resultat.gardes.rupturant++;
      } else if (avecLog.has(dossier._id.toString())) {
        resultat.gardes.log++;
      } else {
        aSupprimer.push(dossier);
      }
    }
    lot = [];
    if (aSupprimer.length === 0) return;

    const ids = aSupprimer.map(({ _id }) => _id);
    if (dryRun) {
      compterSupprimes(aSupprimer);
      resultat.logsSupprimes += await missionLocaleEffectifsLogDb().countDocuments({
        mission_locale_effectif_id: { $in: ids },
      });
      return;
    }

    await missionLocaleEffectifsDb().deleteMany(
      { ...FILTRE_DOSSIER_MASQUE_SANS_TRACE, _id: { $in: ids } },
      { writeConcern: WRITE_CONCERN }
    );
    const restants = await missionLocaleEffectifsDb()
      .find({ _id: { $in: ids } }, { projection: { _id: 1 } })
      .toArray();
    const idsRestants = new Set(restants.map(({ _id }) => _id.toString()));
    const supprimes = aSupprimer.filter(({ _id }) => !idsRestants.has(_id.toString()));
    compterSupprimes(supprimes);

    if (supprimes.length > 0) {
      const { deletedCount } = await missionLocaleEffectifsLogDb().deleteMany(
        { mission_locale_effectif_id: { $in: supprimes.map(({ _id }) => _id) } },
        { writeConcern: WRITE_CONCERN }
      );
      resultat.logsSupprimes += deletedCount;
      await sleep(PAUSE_MS);
    }
  };

  const curseur = missionLocaleEffectifsDb().find(FILTRE_DOSSIER_MASQUE_SANS_TRACE, {
    projection: {
      _id: 1,
      effectif_id: 1,
      "identifiant_normalise.nom": 1,
      "effectif_snapshot.annee_scolaire": 1,
      "effectif_snapshot.source": 1,
    },
    batchSize: TAILLE_LOT,
  });
  for await (const dossier of curseur) {
    lot.push(dossier);
    if (lot.length >= TAILLE_LOT) await traiterLot();
  }
  if (lot.length > 0) await traiterLot();

  logger.info(
    resultat,
    dryRun ? "Purge des dossiers ML masqués sans trace simulée" : "Purge des dossiers ML masqués sans trace terminée"
  );
  return { resultat, idsSupprimes };
};

export const purgerDossiersMlMasques = async (options: { dryRun?: boolean; maintenant?: Date } = {}) =>
  (await executerPurgeDossiersMlMasques(options)).resultat;
