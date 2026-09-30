import { differenceInDays } from "date-fns";
import { ObjectId } from "mongodb";
import { MOTIF_SUPPRESSION } from "shared/constants";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import parentLogger from "@/common/logger";
import {
  effectifsArchiveDb,
  effectifsDb,
  franceTravailEffectifsDb,
  missionLocaleEffectifsDb,
  organismesDb,
  voeuxAffelnetDb,
} from "@/common/model/collections";
import { stripDiacritics } from "@/common/utils/mongoUtils";

import { repointerLiensVersJumeau, type ResultatRepointage } from "./repointer-liens";

const logger = parentLogger.child({ module: "job:effectifs:doublons-obsoletes" });

export const SEUIL_JOURS_DEFAUT = 30;

export type CategorieDoublon = "supprimable" | "oscillation" | "identite_differente";

export type Traitement = "supprimee" | "conservee";

export interface DoublonObsolete {
  effectif_id: ObjectId;
  organisme_id: ObjectId;
  source_organisme_id: string;
  id_erp_apprenant: string;
  annee_scolaire: string;
  statut: string | null;
  derniere_transmission: Date;
  jumeau_id: ObjectId;
  jumeau_organisme_id: ObjectId;
  jumeau_derniere_transmission: Date;
  ecart_jours: number;
  jours_sans_transmission: number;
  categorie: CategorieDoublon;
  liens: {
    ml: boolean;
    jumeau_ml: boolean;
    france_travail: boolean;
    jumeau_france_travail: boolean;
    voeux: boolean;
  };
  traitement?: Traitement;
  motif_conservation?: string;
}

export interface CompteursTraitement {
  supprimees: number;
  conservees: number;
  ml_repointes: number;
  ml_fusionnes: number;
  ml_refuses: number;
  france_travail_repointes: number;
  france_travail_fusionnes: number;
  voeux_repointes: number;
}

interface Compteurs {
  supprimable: number;
  oscillation: number;
  identite_differente: number;
  avec_lien: number;
}

export interface RapportDoublonsObsoletes {
  seuil_jours: number;
  annees_scolaires: string[];
  groupes: number;
  fiches: number;
  par_categorie: Record<CategorieDoublon, number>;
  liens: { ml: number; france_travail: number; voeux: number };
  par_organisme: Array<{ organisme_id: string; nom: string | null; nature: string | null } & Compteurs>;
  par_source: Array<{ source_organisme_id: string; nom: string | null } & Compteurs>;
  fiches_detail: DoublonObsolete[];
  appliquer: boolean;
  traitement: CompteursTraitement | null;
}

interface DocGroupe {
  _id: ObjectId;
  organisme_id: ObjectId;
  transmitted_at: Date | null;
  statut: string | null;
  identite: string;
}

interface Groupe {
  _id: { src: string; id: string; annee: string };
  docs: DocGroupe[];
}

const identiteNormalisee = (champ: string) =>
  stripDiacritics({ $toLower: { $trim: { input: { $ifNull: [champ, ""] } } } });

async function chargerGroupes(annees: string[]): Promise<Groupe[]> {
  return effectifsDb()
    .aggregate<Groupe>(
      [
        {
          $match: {
            annee_scolaire: { $in: annees },
            id_erp_apprenant: { $nin: [null, ""] },
            source_organisme_id: { $nin: [null, ""] },
          },
        },
        {
          $project: {
            organisme_id: 1,
            source_organisme_id: 1,
            id_erp_apprenant: 1,
            annee_scolaire: 1,
            transmitted_at: 1,
            statut: "$_computed.statut.en_cours",
            identite: {
              $concat: [
                identiteNormalisee("$apprenant.nom"),
                "|",
                identiteNormalisee("$apprenant.prenom"),
                "|",
                {
                  $cond: [
                    { $eq: [{ $type: "$apprenant.date_de_naissance" }, "date"] },
                    { $dateToString: { format: "%Y-%m-%d", date: "$apprenant.date_de_naissance" } },
                    "",
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: { src: "$source_organisme_id", id: "$id_erp_apprenant", annee: "$annee_scolaire" },
            orgs: { $addToSet: "$organisme_id" },
            docs: {
              $push: {
                _id: "$_id",
                organisme_id: "$organisme_id",
                transmitted_at: "$transmitted_at",
                statut: "$statut",
                identite: "$identite",
              },
            },
          },
        },
        { $match: { "orgs.1": { $exists: true } } },
        { $project: { docs: 1 } },
      ],
      { allowDiskUse: true }
    )
    .toArray();
}

function classerGroupe(groupe: Groupe, seuilJours: number, date: Date): DoublonObsolete[] {
  const docs = groupe.docs.filter((d): d is DocGroupe & { transmitted_at: Date } => d.transmitted_at instanceof Date);
  if (docs.length < 2) {
    return [];
  }
  const jumeau = docs.reduce((a, b) => (b.transmitted_at > a.transmitted_at ? b : a));

  return docs
    .filter((doc) => !doc._id.equals(jumeau._id))
    .map((doc) => {
      const joursSansTransmission = differenceInDays(date, doc.transmitted_at);
      const categorie: CategorieDoublon =
        doc.identite !== jumeau.identite
          ? "identite_differente"
          : joursSansTransmission >= seuilJours
            ? "supprimable"
            : "oscillation";
      return {
        effectif_id: doc._id,
        organisme_id: doc.organisme_id,
        source_organisme_id: groupe._id.src,
        id_erp_apprenant: groupe._id.id,
        annee_scolaire: groupe._id.annee,
        statut: doc.statut,
        derniere_transmission: doc.transmitted_at,
        jumeau_id: jumeau._id,
        jumeau_organisme_id: jumeau.organisme_id,
        jumeau_derniere_transmission: jumeau.transmitted_at,
        ecart_jours: differenceInDays(jumeau.transmitted_at, doc.transmitted_at),
        jours_sans_transmission: joursSansTransmission,
        categorie,
        liens: { ml: false, jumeau_ml: false, france_travail: false, jumeau_france_travail: false, voeux: false },
      };
    });
}

async function idsLies(
  collection: () => {
    find: (filter: object, options: object) => { toArray: () => Promise<Array<{ effectif_id?: ObjectId | null }>> };
  },
  ids: ObjectId[],
  filtre: object = {}
): Promise<Set<string>> {
  if (ids.length === 0) {
    return new Set();
  }
  const docs = await collection()
    .find({ effectif_id: { $in: ids }, ...filtre }, { projection: { effectif_id: 1 } })
    .toArray();
  return new Set(docs.flatMap((d) => (d.effectif_id ? [d.effectif_id.toString()] : [])));
}

async function renseignerLiens(fiches: DoublonObsolete[]): Promise<void> {
  const ids = fiches.map((f) => f.effectif_id);
  const jumeaux = fiches.map((f) => f.jumeau_id);
  const [ml, ft, voeux] = await Promise.all([
    idsLies(missionLocaleEffectifsDb, [...ids, ...jumeaux], { soft_deleted: { $ne: true } }),
    idsLies(franceTravailEffectifsDb, [...ids, ...jumeaux], { soft_deleted: { $ne: true } }),
    idsLies(voeuxAffelnetDb, ids),
  ]);
  for (const fiche of fiches) {
    fiche.liens = {
      ml: ml.has(fiche.effectif_id.toString()),
      jumeau_ml: ml.has(fiche.jumeau_id.toString()),
      france_travail: ft.has(fiche.effectif_id.toString()),
      jumeau_france_travail: ft.has(fiche.jumeau_id.toString()),
      voeux: voeux.has(fiche.effectif_id.toString()),
    };
  }
}

function compteursVides(): Compteurs {
  return { supprimable: 0, oscillation: 0, identite_differente: 0, avec_lien: 0 };
}

function incrementer(compteurs: Compteurs, fiche: DoublonObsolete) {
  compteurs[fiche.categorie]++;
  if (fiche.liens.ml || fiche.liens.france_travail || fiche.liens.voeux) {
    compteurs.avec_lien++;
  }
}

async function nomsOrganismes(ids: string[]): Promise<Map<string, { nom: string | null; nature: string | null }>> {
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const organismes = await organismesDb()
    .find({ _id: { $in: objectIds } }, { projection: { nom: 1, nature: 1 } })
    .toArray();
  return new Map(organismes.map((o) => [o._id.toString(), { nom: o.nom ?? null, nature: o.nature ?? null }]));
}

export async function rapportDoublonsObsoletes({
  seuilJours = SEUIL_JOURS_DEFAUT,
  date = new Date(),
}: { seuilJours?: number; date?: Date } = {}): Promise<RapportDoublonsObsoletes> {
  const annees = getAnneesScolaireListFromDate(date);
  logger.info({ seuilJours, annees }, "Début du rapport des doublons obsolètes");

  const groupes = await chargerGroupes(annees);
  const fiches = groupes.flatMap((groupe) => classerGroupe(groupe, seuilJours, date));
  await renseignerLiens(fiches);

  const parOrganisme = new Map<string, Compteurs>();
  const parSource = new Map<string, Compteurs>();
  const parCategorie: Record<CategorieDoublon, number> = { supprimable: 0, oscillation: 0, identite_differente: 0 };
  const liens = { ml: 0, france_travail: 0, voeux: 0 };

  for (const fiche of fiches) {
    parCategorie[fiche.categorie]++;
    if (fiche.liens.ml) liens.ml++;
    if (fiche.liens.france_travail) liens.france_travail++;
    if (fiche.liens.voeux) liens.voeux++;

    const orgKey = fiche.organisme_id.toString();
    if (!parOrganisme.has(orgKey)) parOrganisme.set(orgKey, compteursVides());
    incrementer(parOrganisme.get(orgKey)!, fiche);

    if (!parSource.has(fiche.source_organisme_id)) parSource.set(fiche.source_organisme_id, compteursVides());
    incrementer(parSource.get(fiche.source_organisme_id)!, fiche);
  }

  const noms = await nomsOrganismes([...parOrganisme.keys(), ...parSource.keys()]);
  const trier = <T extends Compteurs>(rows: T[]) =>
    rows.sort((a, b) => b.supprimable - a.supprimable || b.oscillation - a.oscillation);

  const rapport: RapportDoublonsObsoletes = {
    seuil_jours: seuilJours,
    annees_scolaires: annees,
    groupes: groupes.length,
    fiches: fiches.length,
    par_categorie: parCategorie,
    liens,
    par_organisme: trier(
      [...parOrganisme.entries()].map(([organisme_id, compteurs]) => ({
        organisme_id,
        nom: noms.get(organisme_id)?.nom ?? null,
        nature: noms.get(organisme_id)?.nature ?? null,
        ...compteurs,
      }))
    ),
    par_source: trier(
      [...parSource.entries()].map(([source_organisme_id, compteurs]) => ({
        source_organisme_id,
        nom: noms.get(source_organisme_id)?.nom ?? null,
        ...compteurs,
      }))
    ),
    fiches_detail: fiches,
    appliquer: false,
    traitement: null,
  };

  logger.info(
    {
      groupes: rapport.groupes,
      fiches: rapport.fiches,
      par_categorie: rapport.par_categorie,
      liens: rapport.liens,
      organismes: rapport.par_organisme.length,
      sources: rapport.par_source.length,
    },
    "Rapport des doublons obsolètes terminé (aucune écriture)"
  );

  return rapport;
}

async function archiverEtSupprimer(fiche: DoublonObsolete, date: Date): Promise<boolean> {
  const effectif = await effectifsDb().findOne({ _id: fiche.effectif_id });
  if (!effectif) {
    return false;
  }
  await effectifsArchiveDb().insertOne({
    ...effectif,
    _id: new ObjectId(),
    suppression: {
      user_id: null,
      motif: MOTIF_SUPPRESSION.Doublon,
      description: `Doublon obsolète ${fiche.effectif_id} de la fiche ${fiche.jumeau_id}`,
      date,
    },
  });
  await effectifsDb().deleteOne({ _id: fiche.effectif_id });
  return true;
}

function conserver(fiche: DoublonObsolete, compteurs: CompteursTraitement, motif: string) {
  fiche.traitement = "conservee";
  fiche.motif_conservation = motif;
  compteurs.conservees++;
  logger.warn({ effectif_id: fiche.effectif_id, jumeau_id: fiche.jumeau_id, motif }, "Doublon obsolète conservé");
}

function cumuler(compteurs: CompteursTraitement, liens: ResultatRepointage) {
  compteurs.ml_repointes += liens.ml.repointes;
  compteurs.ml_fusionnes += liens.ml.fusionnes;
  compteurs.ml_refuses += liens.ml.refuses;
  compteurs.france_travail_repointes += liens.france_travail.repointes;
  compteurs.france_travail_fusionnes += liens.france_travail.fusionnes;
  compteurs.voeux_repointes += liens.voeux;
}

export async function traiterDoublonsObsoletes({
  seuilJours = SEUIL_JOURS_DEFAUT,
  date = new Date(),
  appliquer = false,
}: { seuilJours?: number; date?: Date; appliquer?: boolean } = {}): Promise<RapportDoublonsObsoletes> {
  const rapport = await rapportDoublonsObsoletes({ seuilJours, date });
  if (!appliquer) {
    return rapport;
  }

  const compteurs: CompteursTraitement = {
    supprimees: 0,
    conservees: 0,
    ml_repointes: 0,
    ml_fusionnes: 0,
    ml_refuses: 0,
    france_travail_repointes: 0,
    france_travail_fusionnes: 0,
    voeux_repointes: 0,
  };
  const missionsLocales = new Map<string, ObjectId>();

  for (const fiche of rapport.fiches_detail) {
    if (fiche.categorie !== "supprimable") {
      continue;
    }
    const jumeau = await effectifsDb().findOne({ _id: fiche.jumeau_id });
    if (!jumeau) {
      conserver(fiche, compteurs, "jumeau introuvable");
      continue;
    }
    const liens = await repointerLiensVersJumeau(fiche.effectif_id, jumeau);
    cumuler(compteurs, liens);
    for (const missionLocaleId of liens.missions_locales) {
      missionsLocales.set(missionLocaleId.toString(), missionLocaleId);
    }
    if (liens.ml.refuses > 0) {
      conserver(fiche, compteurs, "migration du dossier Mission Locale refusée");
      continue;
    }
    if (!(await archiverEtSupprimer(fiche, date))) {
      conserver(fiche, compteurs, "fiche introuvable");
      continue;
    }
    fiche.traitement = "supprimee";
    compteurs.supprimees++;
    logger.info(
      { effectif_id: fiche.effectif_id, jumeau_id: fiche.jumeau_id, organisme_id: fiche.organisme_id, liens },
      "Doublon obsolète archivé et supprimé"
    );
  }

  for (const missionLocaleId of missionsLocales.values()) {
    try {
      await createOrUpdateMissionLocaleStats(missionLocaleId, date);
    } catch (err) {
      logger.warn({ err, mission_locale_id: missionLocaleId }, "Stats de la Mission Locale non rafraîchies");
    }
  }

  logger.info(compteurs, "Traitement des doublons obsolètes terminé");
  return { ...rapport, appliquer: true, traitement: compteurs };
}
