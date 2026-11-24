import type { AnyBulkWriteOperation, Document, ObjectId } from "mongodb";
import { COLLABORATION_CUTOFF_DATE, REPONDU_SITUATIONS } from "shared/constants/collaboration";
import type { IOrganisationMissionLocale } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import {
  COMPTEURS_PURGES_ML,
  type IMissionLocaleEffectifsPurgesStats,
  type TypePurgeMl,
} from "shared/models/data/missionLocaleEffectifsPurgesStats.model";
import type { IMissionLocaleStats, IMissionLocaleStatsSegments } from "shared/models/data/missionLocaleStats.model";
import { getBornesNaissanceMissionLocale } from "shared/utils/missionLocaleAge";

import { RESULTAT_SITUATIONS } from "@/common/actions/mission-locale/collaboration-dossiers.actions";
import { moisUTC } from "@/common/actions/mission-locale/mission-locale-purges-stats.actions";
import { DEFAULT_MOTIFS } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import {
  addCollabSituationField,
  addPremiereActiviteMlField,
  computeMissionLocaleStats,
  DEJA_CONNU_ACCOMPAGNE_CONDITION,
  DELAI_PREMIERE_ACTIVITE_EXPR,
  HAS_PREMIERE_ACTIVITE_CONDITION,
} from "@/common/actions/mission-locale/mission-locale.actions";
import logger from "@/common/logger";
import {
  missionLocaleEffectifsDb,
  missionLocaleEffectifsPurgesStatsDb,
  missionLocaleStatsPurgesDb,
  organisationsDb,
  usersMigrationDb,
} from "@/common/model/collections";

export type DossierMlACompter = {
  _id: ObjectId;
  mission_locale_id: ObjectId;
  created_at?: Date | null;
  soft_deleted?: boolean | null;
};

type Increments = Record<string, number>;

type Ligne = {
  type: TypePurgeMl;
  mission_locale_id: ObjectId;
  organisme_id: ObjectId | null;
  region: string | null;
  departement: string | null;
  mois: string;
  compteurs: Increments;
  cfa_active_le: Date | null;
};

export type ContributionsLot = {
  photos: Map<string, { missionLocaleId: ObjectId; mois: string; dossiers: number; increments: Increments }>;
  lignes: Map<string, Ligne[]>;
};

type Photo = { stats: IMissionLocaleStats["stats"]; segments: IMissionLocaleStatsSegments };

const PARIS = "Europe/Paris";

const UN = { $literal: 1 };
const un = (condition: Document) => ({ $cond: [condition, 1, 0] });
const situationIn = (situations: ReadonlyArray<SITUATION_ENUM>) => ({
  $in: [{ $ifNull: ["$situation", null] }, situations],
});
const moisParis = (champ: string) => ({ $dateToString: { format: "%Y-%m", date: champ, timezone: PARIS } });
const egal = (champ: string | Document, valeur: unknown) => ({ $eq: [champ, valeur] });
const taille = (champ: string) => ({ $size: { $ifNull: [champ, []] } });

const SITUATION_RENSEIGNEE = { $ne: [{ $ifNull: ["$situation", null] }, null] };
const NON_MASQUE = { $ne: ["$soft_deleted", true] };

const COLLAB_ENVOYE = (maintenant: Date) => ({
  $and: [
    egal("$organisme_data.acc_conjoint", true),
    { $ne: [{ $ifNull: ["$organisme_data.acc_conjoint_at", null] }, null] },
    { $lte: ["$organisme_data.acc_conjoint_at", maintenant] },
  ],
});

const V2_ENVOYE = {
  $and: [
    egal("$organisme_data.acc_conjoint", true),
    { $gte: ["$organisme_data.reponse_at", COLLABORATION_CUTOFF_DATE] },
  ],
};

const MOTIFS = {
  $cond: [{ $isArray: "$organisme_data.motif" }, "$organisme_data.motif", ["$organisme_data.motif"]],
};

const objectif = (motif: string) => ({
  $size: { $filter: { input: MOTIFS, cond: egal("$$this", motif.toUpperCase()) } },
});

const agesMissionLocale = (maintenant: Date) => {
  const { nesApres, nesAvant } = getBornesNaissanceMissionLocale(maintenant);
  const naissance = "$effectif_snapshot.apprenant.date_de_naissance";
  return { $and: [{ $gte: [naissance, nesApres] }, { $lte: [naissance, nesAvant] }] };
};

const compteursCollab = (maintenant: Date) => ({
  envoyes: UN,
  contactes: un(SITUATION_RENSEIGNEE),
  traitees: un({
    $not: [{ $in: [{ $ifNull: ["$situation", null] }, [null, SITUATION_ENUM.CONTACTE_SANS_RETOUR]] }],
  }),
  ...Object.fromEntries(
    Object.entries(RESULTAT_SITUATIONS)
      .filter(([cle]) => cle !== "a_recontacter")
      .map(([cle, situations]) => [`resultat_${cle}`, un(situationIn(situations))])
  ),
  repondus: un(situationIn(REPONDU_SITUATIONS)),
  deja_connus: un({ $and: [SITUATION_RENSEIGNEE, DEJA_CONNU_ACCOMPAGNE_CONDITION] }),
  delai_total: { $cond: [HAS_PREMIERE_ACTIVITE_CONDITION, DELAI_PREMIERE_ACTIVITE_EXPR, 0] },
  delai_count: un(HAS_PREMIERE_ACTIVITE_CONDITION),
  ...Object.fromEntries(
    [
      "rupture",
      "abandon",
      "prevention_inevitable",
      "prevention_tres_eleve",
      "prevention_modere",
      "besoin_aide_hors_rupture",
    ].map((situation) => [`situation_${situation}`, un(egal("$collab_situation", situation))])
  ),
  ...Object.fromEntries(Object.keys(DEFAULT_MOTIFS).map((motif) => [`objectif_${motif}`, objectif(motif)])),
  ages_ml_envoyes: un(agesMissionLocale(maintenant)),
  ...Object.fromEntries(
    Object.keys(DEFAULT_MOTIFS).map((motif) => [
      `ages_ml_objectif_${motif}`,
      { $cond: [agesMissionLocale(maintenant), objectif(motif), 0] },
    ])
  ),
  nps_reponses: un({ $isNumber: "$organisme_data.form_feedback.note" }),
  nps_somme: { $cond: [{ $isNumber: "$organisme_data.form_feedback.note" }, "$organisme_data.form_feedback.note", 0] },
  v2_envoyes: un(V2_ENVOYE),
  v2_traites: un({ $and: [V2_ENVOYE, SITUATION_RENSEIGNEE] }),
  v2_repondus: un({ $and: [V2_ENVOYE, situationIn(REPONDU_SITUATIONS)] }),
  v2_rdv: un({ $and: [V2_ENVOYE, egal("$situation", SITUATION_ENUM.RDV_PRIS)] }),
});

const RAPPEL = egal("$whatsapp_callback_requested", true);
const rappelEn = (situations: SITUATION_ENUM[]) => un({ $and: [RAPPEL, situationIn(situations)] });
const PREQUALIF = { $and: [egal("$whatsapp_contact.template_type", "prequalif"), NON_MASQUE] };
const prequalif = (condition: Document) => un({ $and: [PREQUALIF, condition] });
const LIEN_RDV = { $ne: [{ $type: "$whatsapp_contact.rdv_redirect_token" }, "missing"] };
const SITUATIONS_RAPPEL_CLASSEES = [
  SITUATION_ENUM.RDV_PRIS,
  SITUATION_ENUM.NOUVEAU_PROJET,
  SITUATION_ENUM.NOUVEAU_CONTRAT,
  SITUATION_ENUM.DEJA_ACCOMPAGNE,
  SITUATION_ENUM.CONTACTE_SANS_RETOUR,
  SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES,
  SITUATION_ENUM.COORDONNEES_INCORRECT,
];

const compteursWhatsapp = () => ({
  envoyes: UN,
  rappel: un(egal("$whatsapp_contact.user_response", "callback")),
  sans_aide: un(egal("$whatsapp_contact.user_response", "no_help")),
  sans_reponse: un({
    $and: [
      egal({ $type: "$whatsapp_contact.user_response" }, "missing"),
      { $ne: ["$whatsapp_contact.opted_out", true] },
    ],
  }),
  opt_out: un(egal("$whatsapp_contact.opted_out", true)),
  echec: un(egal("$whatsapp_contact.message_status", "failed")),
  rappel_rdv_pris: rappelEn([SITUATION_ENUM.RDV_PRIS]),
  rappel_nouveau_projet: rappelEn([SITUATION_ENUM.NOUVEAU_PROJET, SITUATION_ENUM.NOUVEAU_CONTRAT]),
  rappel_deja_accompagne: rappelEn([SITUATION_ENUM.DEJA_ACCOMPAGNE]),
  rappel_injoignable: rappelEn([SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES]),
  rappel_coordonnees_incorrect: rappelEn([SITUATION_ENUM.COORDONNEES_INCORRECT]),
  rappel_autre: un({ $and: [RAPPEL, SITUATION_RENSEIGNEE, { $not: [situationIn(SITUATIONS_RAPPEL_CLASSEES)] }] }),
  prequalif_envoyes: prequalif({ $literal: true }),
  prequalif_backfill: prequalif(egal("$whatsapp_contact.sent_via", "backfill")),
  prequalif_daily: prequalif(egal("$whatsapp_contact.sent_via", "daily")),
  prequalif_echec: prequalif(egal("$whatsapp_contact.message_status", "failed_send")),
  prequalif_opt_out: prequalif(egal("$whatsapp_contact.opted_out", true)),
  prequalif_oui: prequalif(egal("$whatsapp_contact.user_response", "prequalif_yes")),
  prequalif_non: prequalif(egal("$whatsapp_contact.user_response", "prequalif_no")),
  prequalif_reponse_auto: prequalif(egal("$whatsapp_contact.auto_reply_sent", true)),
  prequalif_liens: prequalif(LIEN_RDV),
  prequalif_clics: { $cond: [{ $and: [PREQUALIF, LIEN_RDV] }, taille("$whatsapp_contact.rdv_clicks"), 0] },
  prequalif_cliqueurs: prequalif({ $and: [LIEN_RDV, { $gt: [taille("$whatsapp_contact.rdv_clicks"), 0] }] }),
});

type ContributionDossier = {
  _id: ObjectId;
  mission_locale_id: ObjectId;
  organisme_id: ObjectId | null;
  region: string | null;
  departement: string | null;
  cfa_active_le: Date | null;
  suivi: { mois: string; compteurs: Increments } | null;
  collab: { mois: string; compteurs: Increments } | null;
  whatsapp: { mois: string; compteurs: Increments } | null;
};

const calculerLignes = async (missionLocaleId: ObjectId, ids: ObjectId[], maintenant: Date) => {
  const mlUserIds = await usersMigrationDb().distinct("_id", { organisation_id: missionLocaleId });
  const collabEnvoye = COLLAB_ENVOYE(maintenant);
  const contributions = await missionLocaleEffectifsDb()
    .aggregate<ContributionDossier>([
      { $match: { _id: { $in: ids } } },
      {
        $lookup: {
          from: "missionLocaleEffectifLog",
          localField: "_id",
          foreignField: "mission_locale_effectif_id",
          pipeline: [{ $match: { created_at: { $lte: maintenant } } }, { $project: { created_at: 1, created_by: 1 } }],
          as: "filteredLogs",
        },
      },
      { $addFields: { computed_connaissance_ml: "$connaissance_ml", computed_deja_connu: "$deja_connu" } },
      addCollabSituationField(),
      addPremiereActiviteMlField(mlUserIds),
      {
        $lookup: {
          from: "organismes",
          localField: "effectif_snapshot.organisme_id",
          foreignField: "_id",
          pipeline: [{ $project: { "adresse.region": 1, "adresse.departement": 1 } }],
          as: "organisme",
        },
      },
      {
        $lookup: {
          from: "organisations",
          let: { organisme: { $toString: "$effectif_snapshot.organisme_id" } },
          pipeline: [
            {
              $match: {
                type: "ORGANISME_FORMATION",
                ml_beta_activated_at: { $type: "date" },
                $expr: { $and: [{ $ne: ["$$organisme", null] }, { $eq: ["$organisme_id", "$$organisme"] }] },
              },
            },
            { $group: { _id: null, date: { $min: "$ml_beta_activated_at" } } },
          ],
          as: "activation",
        },
      },
      {
        $project: {
          _id: 1,
          mission_locale_id: 1,
          organisme_id: { $ifNull: ["$effectif_snapshot.organisme_id", null] },
          region: { $ifNull: [{ $first: "$organisme.adresse.region" }, null] },
          departement: { $ifNull: [{ $first: "$organisme.adresse.departement" }, null] },
          cfa_active_le: {
            $cond: [{ $gt: [{ $size: "$organisme" }, 0] }, { $ifNull: [{ $first: "$activation.date" }, null] }, null],
          },
          suivi: {
            $cond: [
              NON_MASQUE,
              {
                mois: moisParis("$created_at"),
                compteurs: { dossiers: UN, v2_dossiers: un({ $gte: ["$created_at", COLLABORATION_CUTOFF_DATE] }) },
              },
              null,
            ],
          },
          collab: {
            $cond: [
              { $and: [NON_MASQUE, collabEnvoye] },
              { mois: moisParis("$organisme_data.acc_conjoint_at"), compteurs: compteursCollab(maintenant) },
              null,
            ],
          },
          whatsapp: {
            $cond: [
              { $ne: [{ $ifNull: ["$whatsapp_contact.last_message_sent_at", null] }, null] },
              { mois: moisParis("$whatsapp_contact.last_message_sent_at"), compteurs: compteursWhatsapp() },
              null,
            ],
          },
        },
      },
    ])
    .toArray();

  return contributions.map((contribution): [string, Ligne[]] => {
    const dimensions = {
      mission_locale_id: contribution.mission_locale_id,
      organisme_id: contribution.organisme_id,
      region: contribution.region,
      departement: contribution.departement,
      cfa_active_le: contribution.cfa_active_le,
    };
    const lignes: Ligne[] = [];
    if (contribution.suivi) lignes.push({ ...dimensions, type: "suivi", ...contribution.suivi });
    if (contribution.collab) lignes.push({ ...dimensions, type: "collab", ...contribution.collab });
    if (contribution.whatsapp) lignes.push({ ...dimensions, type: "whatsapp", ...contribution.whatsapp });
    return [contribution._id.toString(), lignes];
  });
};

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

const grouperParPhoto = (dossiers: DossierMlACompter[]) => {
  const groupes = new Map<string, { missionLocaleId: ObjectId; mois: string; ids: ObjectId[] }>();
  for (const { _id, mission_locale_id, created_at, soft_deleted } of dossiers) {
    if (soft_deleted || !created_at) continue;
    const mois = moisUTC(created_at);
    const cle = `${mission_locale_id.toString()} ${mois}`;
    const groupe = groupes.get(cle);
    if (groupe) {
      groupe.ids.push(_id);
    } else {
      groupes.set(cle, { missionLocaleId: mission_locale_id, mois, ids: [_id] });
    }
  }
  return groupes;
};

const calculerPhotos = async (dossiers: DossierMlACompter[]): Promise<ContributionsLot["photos"]> => {
  const photos: ContributionsLot["photos"] = new Map();
  const organisations = new Map<string, IOrganisationMissionLocale | null>();
  for (const [cle, { missionLocaleId, mois, ids }] of grouperParPhoto(dossiers)) {
    const idMl = missionLocaleId.toString();
    if (!organisations.has(idMl)) {
      const organisation = await organisationsDb().findOne({ _id: missionLocaleId, type: "MISSION_LOCALE" });
      organisations.set(idMl, organisation as IOrganisationMissionLocale | null);
    }
    const organisation = organisations.get(idMl);
    if (!organisation) {
      logger.warn(
        { mission_locale_id: missionLocaleId, dossiers: ids.length },
        "Purge des dossiers de suivi : mission locale introuvable, dossiers absents des photos"
      );
      continue;
    }
    const photo = await computeMissionLocaleStats(organisation, new Date(), ids);
    photos.set(cle, { missionLocaleId, mois, dossiers: ids.length, increments: aplatir(photo) });
  }
  return photos;
};

export const calculerContributions = async (dossiers: DossierMlACompter[]): Promise<ContributionsLot> => {
  const maintenant = new Date();
  const lignes: ContributionsLot["lignes"] = new Map();
  for (const { missionLocaleId, ids } of grouperParMl(dossiers).values()) {
    for (const [id, lignesDossier] of await calculerLignes(missionLocaleId, ids, maintenant)) {
      lignes.set(id, lignesDossier);
    }
  }
  return { photos: await calculerPhotos(dossiers), lignes };
};

export const retirerRestants = async (
  contributions: ContributionsLot,
  restants: DossierMlACompter[]
): Promise<ContributionsLot> => {
  for (const { _id } of restants) contributions.lignes.delete(_id.toString());
  for (const [cle, restant] of await calculerPhotos(restants)) {
    const photo = contributions.photos.get(cle);
    if (!photo) continue;
    if (restant.dossiers >= photo.dossiers) {
      contributions.photos.delete(cle);
      continue;
    }
    for (const [champ, valeur] of Object.entries(restant.increments)) {
      photo.increments[champ] = Math.max(0, (photo.increments[champ] ?? 0) - valeur);
    }
  }
  return contributions;
};

const sommerLignes = (lignes: Ligne[]) => {
  const sommes = new Map<string, Ligne>();
  for (const ligne of lignes) {
    const { compteurs, cfa_active_le, ...dimensions } = ligne;
    const cle = JSON.stringify(dimensions);
    const somme = sommes.get(cle);
    if (!somme) {
      sommes.set(cle, {
        ...dimensions,
        cfa_active_le,
        compteurs: Object.fromEntries(COMPTEURS_PURGES_ML[ligne.type].map((champ) => [champ, compteurs[champ] ?? 0])),
      });
      continue;
    }
    if (cfa_active_le && (!somme.cfa_active_le || cfa_active_le < somme.cfa_active_le)) {
      somme.cfa_active_le = cfa_active_le;
    }
    for (const champ of COMPTEURS_PURGES_ML[ligne.type]) {
      somme.compteurs[champ] += compteurs[champ] ?? 0;
    }
  }
  return [...sommes.values()];
};

export const nombreDeDossiersComptes = (contributions: ContributionsLot) =>
  [...contributions.lignes.values()].filter((lignes) => lignes.some(({ type }) => type === "suivi")).length;

export const ecrireContributions = async (
  contributions: ContributionsLot,
  writeConcern: { w: "majority"; wtimeoutMS: number }
) => {
  const maintenant = new Date();
  const photos = [...contributions.photos.values()]
    .filter(({ increments }) => Object.values(increments).some((valeur) => valeur !== 0))
    .map(({ missionLocaleId, mois, increments }) => ({
      updateOne: {
        filter: { mission_locale_id: missionLocaleId, mois },
        update: { $inc: increments, $set: { updated_at: maintenant } },
        upsert: true,
      },
    }));
  const lignes = sommerLignes([...contributions.lignes.values()].flat()).map(
    ({ compteurs, cfa_active_le, ...dimensions }): AnyBulkWriteOperation<IMissionLocaleEffectifsPurgesStats> => ({
      updateOne: {
        filter: dimensions,
        update: {
          $inc: prefixer("compteurs", compteurs),
          $set: { updated_at: maintenant },
          ...(cfa_active_le ? { $min: { cfa_active_le } } : {}),
        },
        upsert: true,
      },
    })
  );
  if (lignes.length > 0) {
    await missionLocaleEffectifsPurgesStatsDb().bulkWrite(lignes, { ordered: false, writeConcern });
  }
  if (photos.length > 0) {
    await missionLocaleStatsPurgesDb().bulkWrite(photos, { ordered: false, writeConcern });
  }
};
