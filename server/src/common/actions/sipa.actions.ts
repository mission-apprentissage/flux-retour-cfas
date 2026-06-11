import Boom from "boom";
import { ObjectId } from "mongodb";
import { DEPARTEMENTS_BY_CODE } from "shared/constants";
import { IContrat } from "shared/models/data/effectifs/contrat.part";
import { SIPA_PASSWORD_MAX_LENGTH, SIPA_PASSWORD_MIN_LENGTH, zSipaUsername } from "shared/models/data/sipaUsers.model";
import { z } from "zod";

import { effectifsDb, sipaUsersDb } from "@/common/model/collections";
import { createSipaToken } from "@/common/utils/jwtUtils";
import { stripDiacritics } from "@/common/utils/mongoUtils";
import { compare, hash } from "@/common/utils/passwordUtils";
import config from "@/config";

export const zSipaLoginBody = z.object({
  username: zSipaUsername,
  password: z.string().min(1).max(SIPA_PASSWORD_MAX_LENGTH),
});

export const isSipaConfigured = !!config.auth.sipa.jwtSecret;

// Hash factice pour éviter les attaques par timing
let dummyHash: string | undefined;
const getDummyHash = () => (dummyHash ??= hash("dummy-password-never-matches"));

export async function loginSipa(username: string, password: string): Promise<{ token: string; expiresIn: number }> {
  const user = isSipaConfigured ? await sipaUsersDb().findOne({ username }) : null;
  const passOk = compare(password, user?.password ?? getDummyHash());
  if (!user || !passOk) throw Boom.unauthorized("Identifiant ou mot de passe incorrect");
  await sipaUsersDb().updateOne({ _id: user._id }, { $set: { last_connection: new Date() } });

  return { token: createSipaToken(username), expiresIn: config.auth.sipa.expiresIn };
}

export async function createSipaUser(username: string, password: string): Promise<void> {
  if (!zSipaUsername.safeParse(username).success) {
    throw Boom.badRequest("Username invalide : alphanumérique + . - _ (max 64 caractères)");
  }
  if (password.length < SIPA_PASSWORD_MIN_LENGTH || password.length > SIPA_PASSWORD_MAX_LENGTH) {
    throw Boom.badRequest(
      `Le mot de passe doit faire entre ${SIPA_PASSWORD_MIN_LENGTH} et ${SIPA_PASSWORD_MAX_LENGTH} caractères`
    );
  }
  const existing = await sipaUsersDb().findOne({ username });
  if (existing) throw Boom.conflict(`Le compte SIPA "${username}" existe déjà`);
  await sipaUsersDb().insertOne({
    _id: new ObjectId(),
    username,
    password: hash(password),
    created_at: new Date(),
  });
}

export async function deleteSipaUser(username: string): Promise<void> {
  const { deletedCount } = await sipaUsersDb().deleteOne({ username });
  if (!deletedCount) throw Boom.notFound(`Compte SIPA "${username}" introuvable`);
}

const SIPA_PAGE_SIZE = 1000;

// Conversion codes départements en 0xx
export function sipaDeptToDb(code: string): string {
  if (!/^([0-9]{3}|02[AB])$/.test(code)) throw Boom.badData(`Département non conforme : ${code}`);
  const short = code.startsWith("0") ? code.slice(1) : code;
  if (!(short in DEPARTEMENTS_BY_CODE)) throw Boom.badData(`Département inconnu : ${code}`);
  return short;
}

export function dbDeptToSipa(code: string | null | undefined): string | null {
  return code ? code.padStart(3, "0") : null;
}

// Validation de la query
// 400 = structure invalide
// 422 = données non conformes (date invalide, département inconnu…)
const zSuiviQuery = z.object({
  dateDebutFormationMin: z.string(),
  dateDebutFormationMax: z.string(),
  departements: z.preprocess((v) => (typeof v === "string" ? v.split(",") : v), z.array(z.string()).min(1)),
  page: z.coerce.number().int().positive().default(1),
});

function parseDateUTC(s: string, label: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw Boom.badData(`${label} : format attendu AAAA-MM-JJ`);
  const d = new Date(`${s}T00:00:00.000Z`);
  if (isNaN(+d) || d.toISOString().slice(0, 10) !== s) throw Boom.badData(`${label} : date invalide`);
  return d;
}

export interface ISipaSuiviParams {
  dateMin: Date;
  dateMax: Date;
  departementsDb: string[];
  page: number;
}

export async function parseSuiviQuery(query: unknown): Promise<ISipaSuiviParams> {
  const parsed = await zSuiviQuery.parseAsync(query);
  const dateMin = parseDateUTC(parsed.dateDebutFormationMin, "dateDebutFormationMin");
  const dateMax = parseDateUTC(parsed.dateDebutFormationMax, "dateDebutFormationMax");
  if (dateMin > dateMax) throw Boom.badData("dateDebutFormationMin est postérieure à dateDebutFormationMax");
  if (parsed.departements.length > 10) throw Boom.badData("Maximum 10 départements par appel");
  return { dateMin, dateMax, departementsDb: parsed.departements.map(sipaDeptToDb), page: parsed.page };
}

export async function getSuiviSipaEffectifs(params: ISipaSuiviParams) {
  const { dateMin, dateMax, departementsDb, page } = params;
  const dateMaxEndOfDay = new Date(dateMax.getTime() + 24 * 3600 * 1000 - 1);

  const ddnLowerBound = new Date(dateMin.getTime());
  ddnLowerBound.setUTCFullYear(ddnLowerBound.getUTCFullYear() - 18);
  ddnLowerBound.setUTCDate(ddnLowerBound.getUTCDate() - 2);

  const match = {
    "_computed.organisme.departement": { $in: departementsDb },
    "formation.date_entree": { $gte: dateMin, $lte: dateMaxEndOfDay },
    "formation.niveau": { $in: ["3", "4", "5"] },
    "apprenant.date_de_naissance": { $gt: ddnLowerBound },
    $expr: {
      $lt: [
        { $dateTrunc: { date: "$formation.date_entree", unit: "day" } },
        {
          $dateAdd: {
            startDate: { $dateTrunc: { date: "$apprenant.date_de_naissance", unit: "day" } },
            unit: "year",
            amount: 18,
          },
        },
      ],
    },
  };

  const projection = {
    source: 1,
    updated_at: 1,
    created_at: 1,
    organisme_id: 1,
    contrats: 1,
    "apprenant.ine": 1,
    "apprenant.nom": 1,
    "apprenant.prenom": 1,
    "apprenant.date_de_naissance": 1,
    "formation.date_entree": 1,
    "formation.date_fin": 1,
    "formation.date_inscription": 1,
    "formation.niveau": 1,
    "formation.libelle_long": 1,
    "_computed.organisme.departement": 1,
    "_computed.organisme.uai": 1,
    "_computed.organisme.siret": 1,
    "lieu_de_formation.uai": 1,
  };

  const pipeline: Record<string, unknown>[] = [
    { $match: match },
    { $project: projection },
    { $unionWith: { coll: "effectifsDECA", pipeline: [{ $match: match }, { $project: projection }] } },
    {
      $addFields: {
        _dedup_nom: stripDiacritics({ $toLower: { $trim: { input: { $ifNull: ["$apprenant.nom", ""] } } } }),
        _dedup_prenom: stripDiacritics({ $toLower: { $trim: { input: { $ifNull: ["$apprenant.prenom", ""] } } } }),
        _dedup_ddn: { $dateTrunc: { date: "$apprenant.date_de_naissance", unit: "day" } },
        source_priority: { $cond: [{ $eq: ["$source", "DECA"] }, 0, 1] },
      },
    },
    { $sort: { source_priority: 1, "formation.date_inscription": -1, _id: 1 } },
    {
      $group: {
        _id: { nom: "$_dedup_nom", prenom: "$_dedup_prenom", ddn: "$_dedup_ddn" },
        doc: { $first: "$$ROOT" },
        ines: { $addToSet: "$apprenant.ine" },
      },
    },
    { $replaceRoot: { newRoot: { $mergeObjects: ["$doc", { _ines: "$ines" }] } } },
    {
      $facet: {
        total: [{ $count: "count" }],
        effectifs: [
          { $sort: { _dedup_nom: 1, _dedup_prenom: 1, _dedup_ddn: 1, _id: 1 } },
          { $skip: (page - 1) * SIPA_PAGE_SIZE },
          { $limit: SIPA_PAGE_SIZE },
          {
            $lookup: {
              from: "organismes",
              localField: "organisme_id",
              foreignField: "_id",
              as: "_organisme",
              pipeline: [{ $project: { nom: 1, adresse: 1 } }],
            },
          },
        ],
      },
    },
  ];

  const [result] = await effectifsDb().aggregate(pipeline, { allowDiskUse: true }).toArray();
  const totalElements = result?.total?.[0]?.count ?? 0;

  return {
    metadonnees: {
      page,
      totalPages: Math.ceil(totalElements / SIPA_PAGE_SIZE),
      totalElements,
    },
    effectifs: (result?.effectifs ?? []).map(serializeSipaEffectif),
  };
}

const toDateStr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

const truncate = (v: string | null | undefined, max: number) => (v == null ? null : v.slice(0, max));

function dernierContrat(contrats: IContrat[] | null | undefined) {
  const avecDate = (contrats ?? []).filter((c) => c.date_debut);
  if (!avecDate.length) return null;
  const dernier = avecDate.reduce((a, b) => (a.date_debut! > b.date_debut! ? a : b));
  return {
    dateDebutContrat: toDateStr(dernier.date_debut),
    dateFinContrat: toDateStr(dernier.date_fin),
    dateConclusionContrat: null, // absent de nos modèles et du flux DECA ingéré
  };
}

function serializeSipaEffectif(doc: any) {
  const organisme = doc._organisme?.[0];
  const adresseConcat =
    [organisme?.adresse?.numero, organisme?.adresse?.voie, organisme?.adresse?.code_postal, organisme?.adresse?.commune]
      .filter(Boolean)
      .join(" ") || null;
  const inesFusion = (doc._ines ?? []).filter(Boolean);
  const ineFallback = inesFusion.length === 1 ? inesFusion[0] : null;
  return {
    source: truncate(doc.source === "DECA" ? "DECA" : "CFA", 10),
    dateActualisation: toDateStr(doc.updated_at ?? doc.created_at),
    apprenant: {
      ine: truncate(doc.apprenant?.ine ?? ineFallback, 11),
      nom: truncate(doc.apprenant?.nom, 200),
      prenom: truncate(doc.apprenant?.prenom, 50),
      dateNaissance: toDateStr(doc.apprenant?.date_de_naissance),
    },
    formation: {
      dateDebutFormation: toDateStr(doc.formation?.date_entree),
      dateFinFormation: toDateStr(doc.formation?.date_fin),
      dateInscriptionCfa: toDateStr(doc.formation?.date_inscription),
      diplomeNiveau: truncate(doc.formation?.niveau, 1),
      intituleDiplome: truncate(doc.formation?.libelle_long, 500),
    },
    organismeFormation: {
      denomination: truncate(organisme?.nom, 500),
      uaiCfa: truncate(doc._computed?.organisme?.uai ?? doc.lieu_de_formation?.uai, 8),
      siret: truncate(doc._computed?.organisme?.siret, 14),
      adresse: truncate(organisme?.adresse?.complete ?? adresseConcat, 870),
      departement: dbDeptToSipa(doc._computed?.organisme?.departement),
    },
    contrats: dernierContrat(doc.contrats),
  };
}
