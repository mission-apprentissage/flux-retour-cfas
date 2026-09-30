import { differenceInDays } from "date-fns";
import { ObjectId } from "mongodb";
import { getAnneesScolaireListFromDate } from "shared/utils";

import parentLogger from "@/common/logger";
import {
  effectifsDb,
  franceTravailEffectifsDb,
  missionLocaleEffectifsDb,
  organismesDb,
  voeuxAffelnetDb,
} from "@/common/model/collections";
import { stripDiacritics } from "@/common/utils/mongoUtils";

const logger = parentLogger.child({ module: "job:effectifs:doublons-obsoletes" });

export const SEUIL_JOURS_DEFAUT = 30;

export type CategorieDoublon = "supprimable" | "oscillation" | "identite_differente";

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
  categorie: CategorieDoublon;
  liens: {
    ml: boolean;
    jumeau_ml: boolean;
    france_travail: boolean;
    voeux: boolean;
  };
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

function classerGroupe(groupe: Groupe, seuilJours: number): DoublonObsolete[] {
  const docs = groupe.docs.filter((d): d is DocGroupe & { transmitted_at: Date } => d.transmitted_at instanceof Date);
  if (docs.length < 2) {
    return [];
  }
  const jumeau = docs.reduce((a, b) => (b.transmitted_at > a.transmitted_at ? b : a));

  return docs
    .filter((doc) => !doc._id.equals(jumeau._id))
    .map((doc) => {
      const ecart = differenceInDays(jumeau.transmitted_at, doc.transmitted_at);
      const categorie: CategorieDoublon =
        doc.identite !== jumeau.identite ? "identite_differente" : ecart >= seuilJours ? "supprimable" : "oscillation";
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
        ecart_jours: ecart,
        categorie,
        liens: { ml: false, jumeau_ml: false, france_travail: false, voeux: false },
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
    idsLies(franceTravailEffectifsDb, ids, { soft_deleted: { $ne: true } }),
    idsLies(voeuxAffelnetDb, ids),
  ]);
  for (const fiche of fiches) {
    fiche.liens = {
      ml: ml.has(fiche.effectif_id.toString()),
      jumeau_ml: ml.has(fiche.jumeau_id.toString()),
      france_travail: ft.has(fiche.effectif_id.toString()),
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
  const fiches = groupes.flatMap((groupe) => classerGroupe(groupe, seuilJours));
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
