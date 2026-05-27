import { ObjectId } from "bson";
import { ACADEMIES_BY_CODE, DEPARTEMENTS_BY_CODE, REGIONS_BY_CODE, STATUT_APPRENANT } from "shared/constants";
import type { IDepartmentCode } from "shared/constants/territoires";
import { getAnneesScolaireListFromDate, getAnneeScolaireListFromDateRange } from "shared/utils";

import { findEligibleOrganismes } from "@/common/actions/organismes/deca-cfa-eligibility";
import {
  buildEffRuptureAgeFilter,
  createDernierStatutFieldPipeline,
  DATE_START_RUPTURES,
} from "@/common/actions/shared/rupture-pipeline.utils";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleStatsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { BrevoContact, BrevoContactAttributeValue } from "@/common/services/brevo/brevo";
import config from "@/config";

import { getOrCreateConnexionInvitationsByEmails } from "./connexion-invitations.actions";
import { cleanSiret, formatCivilite, formatEmail, formatJoinedList, formatName, formatPhoneFR } from "./formatters";
import { BrevoAttributeType, ContactListDefinition, ContactListUtm } from "./types";
import { buildUtmUrl } from "./utm";

const TBA_CONTACTS_UTM: ContactListUtm = {
  source: "brevo",
  medium: "email",
};

// Tous les profils métier, sauf les comptes internes `ADMINISTRATEUR`.
const TYPES_TO_SYNC = [
  "ORGANISME_FORMATION",
  "MISSION_LOCALE",
  "ARML",
  "TETE_DE_RESEAU",
  "OPERATEUR_PUBLIC_NATIONAL",
  "CARIF_OREF_NATIONAL",
  "CARIF_OREF_REGIONAL",
  "DREETS",
  "DRAAF",
  "DRAFPIC",
  "CONSEIL_REGIONAL",
  "DDETS",
  "ACADEMIE",
  "FRANCE_TRAVAIL",
] as const;

type OrganisationType = (typeof TYPES_TO_SYNC)[number];

export type TbaContactAttributeName =
  | "CIVILITE"
  | "NOM"
  | "PRENOM"
  | "FONCTION"
  | "TELEPHONE"
  | "SOURCE_EMAIL"
  | "DATE_INSCRIPTION_USER_TBA"
  | "DATE_DERNIERE_CONNEXION_USER_TBA"
  | "STATUT_COMPTE_USER"
  | "ORGANISATION"
  | "TYPE_ORGANISATION"
  | "CFA_RESEAUX"
  | "REGION"
  | "DEPARTEMENT_NOM"
  | "DEPARTEMENT_NUM"
  | "ACADEMIE"
  | "ADRESSE"
  | "ENSEIGNE"
  | "RAISON_SOCIALE"
  | "SIRET"
  | "UAI"
  | "UAI_SIRET"
  | "STATUT_SIRET"
  | "ORGANISME_ID"
  | "URL_TBA"
  | "STATUT_FIABILISATION"
  | "CFA_NATURE"
  | "CFA_NB_FORMATEURS"
  | "CFA_ERP_CLIENT"
  | "CFA_ERP_OU_DECA"
  | "CFA_ERP"
  | "CFA_STATUT_CLE_API"
  | "CFA_DATE_DERNIERE_TRANSMISSION"
  | "CFA_DATE_ERREURS_TRANSMISSION"
  | "CFA_NB_ERREURS_TRANSMISSION"
  | "CFA_NB_APPRENANTS_ERP"
  | "CFA_NB_APPRENANTS_DECA"
  | "CFA_NB_RUPTURANTS_ERP"
  | "CFA_NB_RUPTURANTS_DECA"
  | "CFA_STATUT_V2"
  | "ML_DATE_ACTIVATION_ML"
  | "ML_NB_RUPTURANTS_TOTAL"
  | "ML_NB_RUPTURANTS_A_TRAITER"
  | "ML_NB_RUPTURANTS_TRAITES"
  | "ML_POURCENTAGE_RUPTURANTS_TRAITES"
  | "NB_JEUNES_EN_RUPTURE"
  | "NB_MISSIONS_LOCALES_PARTENAIRES"
  | "LISTE_MISSIONS_LOCALES"
  | "LIEN_CONNEXION_PERSONNALISE";

// `undefined` autorisé : un attribut absent du payload est préservé par Brevo,
// alors qu'un attribut à `null` est écrasé. Utilisé pour `CFA_ERP_CLIENT` qui est
// renseigné manuellement côté Brevo par l'équipe.
type TbaContactAttributes = Partial<Record<TbaContactAttributeName, BrevoContactAttributeValue | null>>;

export const tbaContactsAttributesSchema: Record<TbaContactAttributeName, BrevoAttributeType> = {
  CIVILITE: "text",
  NOM: "text",
  PRENOM: "text",
  FONCTION: "text",
  TELEPHONE: "text",
  SOURCE_EMAIL: "text",
  DATE_INSCRIPTION_USER_TBA: "date",
  DATE_DERNIERE_CONNEXION_USER_TBA: "date",
  STATUT_COMPTE_USER: "text",
  ORGANISATION: "text",
  TYPE_ORGANISATION: "text",
  CFA_RESEAUX: "text",
  REGION: "text",
  DEPARTEMENT_NOM: "text",
  DEPARTEMENT_NUM: "text",
  ACADEMIE: "text",
  ADRESSE: "text",
  ENSEIGNE: "text",
  RAISON_SOCIALE: "text",
  SIRET: "text",
  UAI: "text",
  UAI_SIRET: "text",
  STATUT_SIRET: "text",
  ORGANISME_ID: "text",
  URL_TBA: "text",
  STATUT_FIABILISATION: "text",
  CFA_NATURE: "text",
  CFA_NB_FORMATEURS: "float",
  CFA_ERP_CLIENT: "text",
  CFA_ERP_OU_DECA: "text",
  CFA_ERP: "text",
  CFA_STATUT_CLE_API: "text",
  CFA_DATE_DERNIERE_TRANSMISSION: "date",
  CFA_DATE_ERREURS_TRANSMISSION: "date",
  CFA_NB_ERREURS_TRANSMISSION: "float",
  CFA_NB_APPRENANTS_ERP: "float",
  CFA_NB_APPRENANTS_DECA: "float",
  CFA_NB_RUPTURANTS_ERP: "float",
  CFA_NB_RUPTURANTS_DECA: "float",
  CFA_STATUT_V2: "text",
  ML_DATE_ACTIVATION_ML: "date",
  ML_NB_RUPTURANTS_TOTAL: "float",
  ML_NB_RUPTURANTS_A_TRAITER: "float",
  ML_NB_RUPTURANTS_TRAITES: "float",
  ML_POURCENTAGE_RUPTURANTS_TRAITES: "float",
  NB_JEUNES_EN_RUPTURE: "float",
  NB_MISSIONS_LOCALES_PARTENAIRES: "float",
  LISTE_MISSIONS_LOCALES: "text",
  LIEN_CONNEXION_PERSONNALISE: "text",
};

type TbaUserContext = {
  email: string;
  prenom?: string;
  nom?: string;
  civility?: string;
  fonction?: string;
  telephone?: string;
  created_at?: Date;
  last_connection?: Date | null;
  account_status?: string;
  organisation: {
    _id: ObjectId;
    type: OrganisationType;
    nom?: string | null;
    siret?: string | null;
    uai?: string | null;
    ml_beta_activated_at?: Date | null;
    adresse?: TbaAdresse;
  };
  organisme?: {
    _id?: ObjectId;
    nom?: string;
    raison_sociale?: string;
    enseigne?: string | null;
    nature?: string;
    erps?: string[];
    api_key?: string | null;
    last_transmission_date?: Date | null;
    transmission_errors_date?: Date | null;
    mode_de_transmission?: "API" | "MANUEL";
    organismesFormateursCount?: number;
    adresse?: TbaAdresse | null;
    reseaux?: string[];
    fiabilisation_statut?: string;
    ferme?: boolean;
    is_allowed_deca?: boolean | null;
  };
};

type TbaAdresse = {
  region?: string;
  departement?: string;
  academie?: string;
  commune?: string;
  complete?: string | null;
  code_postal?: string | null;
  numero?: number;
  voie?: string;
};

/**
 * Stratégie en 2 phases pour la perf
 *   1. Aggregate users + organisations (lookup `_id`, indexé).
 *   2. `find` séparé sur `organismes` filtré par `uai ∈ [...]`. Jointure JS sur
 *      le couple (uai, siret) — un même uai peut exister sur plusieurs sirets.
 */
const selectTbaContacts = async (): Promise<TbaUserContext[]> => {
  type UserWithOrg = Omit<TbaUserContext, "organisme">;

  // Phase 1 — Aggregate users + organisations (lookup `_id`, indexé).
  const usersWithOrgsStages = [
    { $match: { account_status: "CONFIRMED", unsubscribe: { $ne: true } } },
    {
      $lookup: {
        from: "organisations",
        localField: "organisation_id",
        foreignField: "_id",
        as: "organisation",
      },
    },
    { $unwind: "$organisation" },
    { $match: { "organisation.type": { $in: TYPES_TO_SYNC } } },
    {
      $project: {
        _id: 0,
        email: 1,
        prenom: 1,
        nom: 1,
        civility: 1,
        fonction: 1,
        telephone: 1,
        created_at: 1,
        last_connection: 1,
        account_status: 1,
        organisation: {
          _id: "$organisation._id",
          type: "$organisation.type",
          nom: "$organisation.nom",
          siret: "$organisation.siret",
          uai: "$organisation.uai",
          ml_beta_activated_at: "$organisation.ml_beta_activated_at",
          adresse: "$organisation.adresse",
        },
      },
    },
  ];
  const usersWithOrgs = (await usersMigrationDb().aggregate(usersWithOrgsStages).toArray()) as UserWithOrg[];

  // Phase 2 — Fetch organismes en batch (filtre par `uai` indexé) avec
  // projection ciblée + indexation par `(uai, siret)` côté JS.
  const cfaUaisSet = new Set<string>();
  for (const u of usersWithOrgs) {
    if (u.organisation.type === "ORGANISME_FORMATION" && u.organisation.uai) {
      cfaUaisSet.add(u.organisation.uai);
    }
  }
  const organismeByKey = new Map<string, TbaUserContext["organisme"]>();
  if (cfaUaisSet.size > 0) {
    const rows = await organismesDb()
      .find(
        { uai: { $in: [...cfaUaisSet] } },
        {
          projection: {
            _id: 1,
            siret: 1,
            uai: 1,
            nom: 1,
            raison_sociale: 1,
            enseigne: 1,
            nature: 1,
            erps: 1,
            api_key: 1,
            last_transmission_date: 1,
            transmission_errors_date: 1,
            mode_de_transmission: 1,
            organismesFormateurs: 1,
            adresse: 1,
            reseaux: 1,
            fiabilisation_statut: 1,
            ferme: 1,
            is_allowed_deca: 1,
          },
        }
      )
      .toArray();

    for (const o of rows) {
      organismeByKey.set(`${o.uai}|${o.siret}`, {
        _id: o._id,
        nom: o.nom,
        raison_sociale: o.raison_sociale,
        enseigne: o.enseigne,
        nature: o.nature,
        erps: o.erps,
        api_key: o.api_key,
        last_transmission_date: o.last_transmission_date,
        transmission_errors_date: o.transmission_errors_date,
        mode_de_transmission: o.mode_de_transmission,
        organismesFormateursCount: o.organismesFormateurs?.length ?? 0,
        adresse: o.adresse,
        reseaux: o.reseaux,
        fiabilisation_statut: o.fiabilisation_statut,
        ferme: o.ferme,
        is_allowed_deca: o.is_allowed_deca,
      });
    }
  }

  // Phase 3 — Jointure JS sur le couple `(uai, siret)` — un uai peut couvrir
  // plusieurs sirets
  return usersWithOrgs.map(
    (u): TbaUserContext => ({
      ...u,
      organisme:
        u.organisation.type === "ORGANISME_FORMATION" && u.organisation.uai && u.organisation.siret
          ? organismeByKey.get(`${u.organisation.uai}|${u.organisation.siret}`)
          : undefined,
    })
  );
};

type CfaCounts = { erp: number; deca: number };

// Compte par organisme les effectifs au statut donné, sur l'année scolaire
// courante, en croisant `effectifs` (ERP) et `effectifsDECA`. Utilise les
// index `(organisme_id, annee_scolaire)` des 2 collections.
const fetchCfaCountsByOrgIdForStatus = async (
  orgIds: ObjectId[],
  statut: (typeof STATUT_APPRENANT)["APPRENTI"] | (typeof STATUT_APPRENANT)["RUPTURANT"]
): Promise<Map<string, CfaCounts>> => {
  if (orgIds.length === 0) return new Map();
  const anneeScolaireList = getAnneesScolaireListFromDate(new Date());

  const pipeline = [
    {
      $match: {
        organisme_id: { $in: orgIds },
        annee_scolaire: { $in: anneeScolaireList },
        "_computed.statut.en_cours": statut,
      },
    },
    { $group: { _id: "$organisme_id", count: { $sum: 1 } } },
  ];

  const [erpRows, decaRows] = await Promise.all([
    effectifsDb().aggregate<{ _id: ObjectId; count: number }>(pipeline).toArray(),
    effectifsDECADb().aggregate<{ _id: ObjectId; count: number }>(pipeline).toArray(),
  ]);

  return mergeCfaCounts(erpRows, decaRows);
};

const fetchCfaApprenantsCountsByOrgId = (orgIds: ObjectId[]) =>
  fetchCfaCountsByOrgIdForStatus(orgIds, STATUT_APPRENANT.APPRENTI);

const fetchCfaRupturantsCountsByOrgId = (orgIds: ObjectId[]) =>
  fetchCfaCountsByOrgIdForStatus(orgIds, STATUT_APPRENANT.RUPTURANT);

const mergeCfaCounts = (
  erpRows: Array<{ _id: ObjectId; count: number }>,
  decaRows: Array<{ _id: ObjectId; count: number }>
): Map<string, CfaCounts> => {
  const byOrgId = new Map<string, CfaCounts>();
  for (const row of erpRows) {
    if (!row._id) continue;
    byOrgId.set(String(row._id), { erp: row.count, deca: 0 });
  }
  for (const row of decaRows) {
    if (!row._id) continue;
    const key = String(row._id);
    const existing = byOrgId.get(key) ?? { erp: 0, deca: 0 };
    existing.deca = row.count;
    byOrgId.set(key, existing);
  }
  return byOrgId;
};

type CfaRupturantsStats = {
  nb_jeunes_rupture: number;
  nb_ml_total: number;
  ml_names_top: string[];
  nb_ml_others: number;
};

/**
 * Stats "jeunes en rupture suivis par une ML" côté CFA — définition métier
 * alignée sur `cfa-effectifs-ruptures.actions.ts` (filtres 180j, âge, statut
 * RUPTURANT ou `cfa_rupture_declaration`).
 *
 * Distinct de `CFA_NB_RUPTURANTS_ERP/DECA` (qui compte le statut RUPTURANT brut
 * sur `effectifs[DECA]`) : ici on croise avec `missionLocaleEffectifs` pour ne
 * remonter que les jeunes en rupture qui sont suivis par une ML partenaire.
 */
const fetchRupturantsStatsByOrgId = async (organismeIds: ObjectId[]): Promise<Map<string, CfaRupturantsStats>> => {
  if (organismeIds.length === 0) return new Map();

  // Phase 1 — Filtrage "en rupture" selon la définition métier partagée avec
  // `cfa-effectifs-ruptures.actions.ts` : age, 180j, statut RUPTURANT ou
  // déclaration CFA, exclusion des APPRENTI sans déclaration.
  const enRuptureFilterStages = [
    { $match: { "effectif_snapshot.organisme_id": { $in: organismeIds } } },
    ...buildEffRuptureAgeFilter(),
    {
      $match: {
        "effectif_snapshot.annee_scolaire": {
          $in: getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, new Date()),
        },
      },
    },
    {
      $addFields: {
        date_rupture: { $ifNull: ["$date_rupture", "$cfa_rupture_declaration.date_rupture"] },
      },
    },
    ...createDernierStatutFieldPipeline(),
    {
      $match: {
        $or: [
          {
            "effectif_snapshot._computed.statut.en_cours": STATUT_APPRENANT.RUPTURANT,
            date_rupture: { $lte: new Date() },
          },
          { cfa_rupture_declaration: { $exists: true } },
        ],
      },
    },
    { $match: { dernierStatutDureeInDay: { $lte: 180 } } },
    {
      $match: {
        $or: [
          { cfa_rupture_declaration: { $exists: true } },
          { "current_status.value": { $ne: STATUT_APPRENANT.APPRENTI } },
        ],
      },
    },
  ];

  // Phase 2 — Group fin par (organisme × ML) + lookup pour récupérer le nom ML.
  const groupByOrgAndMlStages = [
    {
      $group: {
        _id: { organisme_id: "$effectif_snapshot.organisme_id", ml_id: "$mission_locale_id" },
        effectifs_count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "organisations",
        let: { mlId: "$_id.ml_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$mlId"] } } }, { $project: { _id: 1, nom: 1 } }],
        as: "ml_info",
      },
    },
    { $unwind: { path: "$ml_info", preserveNullAndEmptyArrays: true } },
  ];

  // Phase 3 — Re-group par organisme avec total + top 2 ML (et count des autres).
  const summarizeByOrgStages = [
    {
      $group: {
        _id: "$_id.organisme_id",
        nb_jeunes_rupture: { $sum: "$effectifs_count" },
        missions_locales: { $push: { nom: "$ml_info.nom", effectifs_count: "$effectifs_count" } },
      },
    },
    {
      $addFields: {
        missions_locales: { $sortArray: { input: "$missions_locales", sortBy: { effectifs_count: -1 } } },
      },
    },
    {
      $project: {
        _id: 1,
        nb_jeunes_rupture: 1,
        nb_ml_total: { $size: "$missions_locales" },
        ml_names_top: { $slice: [{ $map: { input: "$missions_locales", as: "ml", in: "$$ml.nom" } }, 2] },
        nb_ml_others: { $max: [{ $subtract: [{ $size: "$missions_locales" }, 2] }, 0] },
      },
    },
  ];

  const rows = (await missionLocaleEffectifsDb()
    .aggregate([...enRuptureFilterStages, ...groupByOrgAndMlStages, ...summarizeByOrgStages])
    .toArray()) as Array<{ _id: ObjectId } & CfaRupturantsStats>;
  const byOrgId = new Map<string, CfaRupturantsStats>();
  for (const row of rows) {
    byOrgId.set(String(row._id), {
      nb_jeunes_rupture: row.nb_jeunes_rupture,
      nb_ml_total: row.nb_ml_total,
      ml_names_top: row.ml_names_top,
      nb_ml_others: row.nb_ml_others,
    });
  }
  return byOrgId;
};

// "ML A" / "ML A, ML B" / "ML A, ML B et 3 autres"
const formatMlList = (names: string[], others: number): string => {
  const cleaned = names.filter(Boolean);
  if (cleaned.length === 0) return "";
  if (others === 0) return cleaned.join(", ");
  return `${cleaned.join(", ")} et ${others} autre${others > 1 ? "s" : ""}`;
};

type MlStats = { total: number; a_traiter: number; traite: number };

const fetchMlStatsByMlId = async (mlIds: ObjectId[]): Promise<Map<string, MlStats>> => {
  if (mlIds.length === 0) return new Map();
  const rows = await missionLocaleStatsDb()
    .aggregate<{ _id: ObjectId; stats?: { total?: number; a_traiter?: number; traite?: number } }>([
      { $match: { mission_locale_id: { $in: mlIds } } },
      { $sort: { mission_locale_id: 1, computed_day: -1 } },
      { $group: { _id: "$mission_locale_id", stats: { $first: "$stats" } } },
    ])
    .toArray();

  const byMlId = new Map<string, MlStats>();
  for (const row of rows) {
    byMlId.set(String(row._id), {
      total: row.stats?.total ?? 0,
      a_traiter: row.stats?.a_traiter ?? 0,
      traite: row.stats?.traite ?? 0,
    });
  }
  return byMlId;
};

const deriveCfaErpOuDeca = (
  organisme: TbaUserContext["organisme"] | undefined,
  hasDeca: boolean
): "erp" | "deca" | null => {
  if (!organisme) return null;
  if (organisme.mode_de_transmission === "API") return "erp";
  if (hasDeca) return "deca";
  return null;
};

// Statut V2 (cf. MDD) : "oui" = déjà activé V2, "activable" = passe les 5 checks
// de `findEligibleOrganismes` sans encore l'être, "exclu" sinon.
const deriveCfaStatutV2 = (
  organisme: TbaUserContext["organisme"] | undefined,
  eligibleOrgIds: Set<string>
): "oui" | "activable" | "exclu" | null => {
  if (!organisme?._id) return "exclu";
  if (organisme.is_allowed_deca === true) return "oui";
  return eligibleOrgIds.has(String(organisme._id)) ? "activable" : "exclu";
};

const buildAttributes = (
  user: TbaUserContext,
  lienConnexionPersonnalise: string,
  apprenantsCounts: CfaCounts | undefined,
  rupturantsCounts: CfaCounts | undefined,
  mlStats: MlStats | undefined,
  rupturantsStats: CfaRupturantsStats | undefined,
  eligibleOrgIds: Set<string>
): TbaContactAttributes => {
  const isCfa = user.organisation.type === "ORGANISME_FORMATION";
  const isMl = user.organisation.type === "MISSION_LOCALE";

  // Adresse de l'organisme (CFA) en priorité, sinon celle de l'organisation
  // (ML, ARML, … — `zAdresse` est partagé).
  const adresse = user.organisme?.adresse ?? user.organisation.adresse;
  const regionLabel = adresse?.region
    ? (REGIONS_BY_CODE[adresse.region as keyof typeof REGIONS_BY_CODE]?.nom ?? null)
    : null;
  const academieLabel = adresse?.academie
    ? (ACADEMIES_BY_CODE[adresse.academie as keyof typeof ACADEMIES_BY_CODE]?.nom ?? null)
    : null;
  const departementNomLabel = adresse?.departement
    ? (DEPARTEMENTS_BY_CODE[adresse.departement as IDepartmentCode]?.nom ?? null)
    : null;
  const adresseString = adresse?.complete ?? buildAdresseFallback(adresse);

  const uai = user.organisation.uai ?? null;
  const siret = cleanSiret(user.organisation.siret);
  const statutSiret: string | null = !siret ? "inconnu" : user.organisme?.ferme ? "ferme" : "ouvert";
  const organisationNom = user.organisme?.nom ?? user.organisme?.raison_sociale ?? user.organisation.nom ?? null;

  const mlPourcentageTraites: number | null =
    isMl && mlStats && mlStats.total > 0 ? Math.round((mlStats.traite / mlStats.total) * 100) : isMl ? 0 : null;

  const hasDeca = (apprenantsCounts?.deca ?? 0) > 0 || (rupturantsCounts?.deca ?? 0) > 0;

  return {
    CIVILITE: formatCivilite(user.civility),
    NOM: formatName(user.nom),
    PRENOM: formatName(user.prenom),
    FONCTION: user.fonction ?? null,
    TELEPHONE: formatPhoneFR(user.telephone),
    SOURCE_EMAIL: "users_tba",
    DATE_INSCRIPTION_USER_TBA: user.created_at ?? null,
    DATE_DERNIERE_CONNEXION_USER_TBA: user.last_connection ?? null,
    STATUT_COMPTE_USER: user.account_status ?? null,

    ORGANISATION: organisationNom,
    TYPE_ORGANISATION: user.organisation.type,
    CFA_RESEAUX: isCfa ? formatJoinedList(user.organisme?.reseaux) : null,
    REGION: regionLabel,
    DEPARTEMENT_NOM: departementNomLabel,
    DEPARTEMENT_NUM: adresse?.departement ?? null,
    ACADEMIE: academieLabel,
    ADRESSE: adresseString,
    ENSEIGNE: user.organisme?.enseigne ?? null,
    RAISON_SOCIALE: user.organisme?.raison_sociale ?? null,
    SIRET: siret,
    UAI: uai,
    UAI_SIRET: uai && siret ? `${uai}_${siret}` : null,
    STATUT_SIRET: statutSiret,
    ORGANISME_ID: user.organisme?._id ? String(user.organisme._id) : null,
    URL_TBA: isCfa && user.organisme?._id ? `${config.publicUrl}/organismes/${String(user.organisme._id)}` : null,

    STATUT_FIABILISATION: isCfa ? (user.organisme?.fiabilisation_statut ?? null) : null,

    CFA_NATURE: isCfa ? (user.organisme?.nature ?? null) : null,
    CFA_NB_FORMATEURS: isCfa ? (user.organisme?.organismesFormateursCount ?? 0) : null,
    // `CFA_ERP_CLIENT` volontairement absent → Brevo préserve la valeur saisie
    // manuellement par l'équipe lors d'imports CSV des listes clients ERP.
    CFA_ERP_OU_DECA: isCfa ? deriveCfaErpOuDeca(user.organisme, hasDeca) : null,
    CFA_ERP: isCfa ? formatJoinedList(user.organisme?.erps, { lowercase: true }) : null,
    CFA_STATUT_CLE_API: isCfa ? (user.organisme?.api_key ? "1" : "0") : null,
    CFA_DATE_DERNIERE_TRANSMISSION: isCfa ? (user.organisme?.last_transmission_date ?? null) : null,
    CFA_DATE_ERREURS_TRANSMISSION: isCfa ? (user.organisme?.transmission_errors_date ?? null) : null,
    // v1 : à reporter (agrégation `transmissionDailyReport`).
    CFA_NB_ERREURS_TRANSMISSION: null,
    CFA_NB_APPRENANTS_ERP: isCfa ? (apprenantsCounts?.erp ?? 0) : null,
    CFA_NB_APPRENANTS_DECA: isCfa ? (apprenantsCounts?.deca ?? 0) : null,
    CFA_NB_RUPTURANTS_ERP: isCfa ? (rupturantsCounts?.erp ?? 0) : null,
    CFA_NB_RUPTURANTS_DECA: isCfa ? (rupturantsCounts?.deca ?? 0) : null,
    CFA_STATUT_V2: isCfa ? deriveCfaStatutV2(user.organisme, eligibleOrgIds) : null,

    // `ML_DATE_ACTIVATION_ML` est aussi remonté côté OF : c'est la date
    // d'activation de la collab ML côté CFA, pas une stat ML.
    ML_DATE_ACTIVATION_ML: user.organisation.ml_beta_activated_at ?? null,
    ML_NB_RUPTURANTS_TOTAL: isMl ? (mlStats?.total ?? 0) : null,
    ML_NB_RUPTURANTS_A_TRAITER: isMl ? (mlStats?.a_traiter ?? 0) : null,
    ML_NB_RUPTURANTS_TRAITES: isMl ? (mlStats?.traite ?? 0) : null,
    ML_POURCENTAGE_RUPTURANTS_TRAITES: mlPourcentageTraites,

    NB_JEUNES_EN_RUPTURE: isCfa ? (rupturantsStats?.nb_jeunes_rupture ?? 0) : null,
    NB_MISSIONS_LOCALES_PARTENAIRES: isCfa ? (rupturantsStats?.nb_ml_total ?? 0) : null,
    LISTE_MISSIONS_LOCALES: isCfa
      ? rupturantsStats
        ? formatMlList(rupturantsStats.ml_names_top, rupturantsStats.nb_ml_others)
        : ""
      : null,

    LIEN_CONNEXION_PERSONNALISE: lienConnexionPersonnalise,
  };
};

// Fallback quand `adresse.complete` n'est pas disponible : "13 Rue Dutot 75001 PARIS".
const buildAdresseFallback = (adresse: TbaAdresse | null | undefined): string | null => {
  if (!adresse) return null;
  const parts = [[adresse.numero, adresse.voie].filter(Boolean).join(" "), adresse.code_postal, adresse.commune].filter(
    Boolean
  );
  const joined = parts.join(" ").trim();
  return joined.length > 0 ? joined : null;
};

const buildLienConnexionPersonnalise = (token: string): string => {
  const baseAuthUrl = `${config.publicUrl}/auth/connexion?invitationToken=${encodeURIComponent(token)}`;
  return buildUtmUrl(baseAuthUrl, TBA_CONTACTS_UTM);
};

const buildLienByEmail = async (users: TbaUserContext[]): Promise<Map<string, string>> => {
  const tokenByEmail = await getOrCreateConnexionInvitationsByEmails(
    users.map((u) => u.email),
    { source: "tba-contacts" }
  );
  const lienByEmail = new Map<string, string>();
  for (const [email, token] of tokenByEmail) {
    lienByEmail.set(email, buildLienConnexionPersonnalise(token));
  }
  return lienByEmail;
};

const fetchContacts = async (): Promise<BrevoContact[]> => {
  const users = await selectTbaContacts();

  const cfaOrgIds = users
    .filter((u) => u.organisation.type === "ORGANISME_FORMATION")
    .map((u) => u.organisme?._id)
    .filter((id): id is ObjectId => Boolean(id));

  const mlIds = users.filter((u) => u.organisation.type === "MISSION_LOCALE").map((u) => u.organisation._id);

  const [
    apprenantsCountsByOrgId,
    rupturantsCountsByOrgId,
    rupturantsStatsByOrgId,
    mlStatsByMlId,
    lienByEmail,
    eligibleOrgsRows,
  ] = await Promise.all([
    fetchCfaApprenantsCountsByOrgId(cfaOrgIds),
    fetchCfaRupturantsCountsByOrgId(cfaOrgIds),
    fetchRupturantsStatsByOrgId(cfaOrgIds),
    fetchMlStatsByMlId(mlIds),
    buildLienByEmail(users),
    findEligibleOrganismes(cfaOrgIds),
  ]);

  const eligibleOrgIds = new Set(eligibleOrgsRows.map((o) => String(o._id)));

  return users.map((user): BrevoContact => {
    const organismeId = user.organisme?._id ? String(user.organisme._id) : null;
    const apprenantsCounts = organismeId ? apprenantsCountsByOrgId.get(organismeId) : undefined;
    const rupturantsCounts = organismeId ? rupturantsCountsByOrgId.get(organismeId) : undefined;
    const rupturantsStats = organismeId ? rupturantsStatsByOrgId.get(organismeId) : undefined;
    const mlStats =
      user.organisation.type === "MISSION_LOCALE" ? mlStatsByMlId.get(String(user.organisation._id)) : undefined;
    const lien = lienByEmail.get(user.email) ?? "";
    return {
      email: formatEmail(user.email),
      attributes: buildAttributes(
        user,
        lien,
        apprenantsCounts,
        rupturantsCounts,
        mlStats,
        rupturantsStats,
        eligibleOrgIds
      ),
    };
  });
};

// Nom utilisé uniquement à la création auto (dev). En prod la liste cible est
// définie par `config.brevo.tbaContactsListId` et son nom Brevo est préservé.
const buildListName = (): string => "tba_contacts";

export const tbaContactsContactList: ContactListDefinition = {
  slug: "tba-contacts",
  label: "TBA — Tous les utilisateurs",
  description:
    "Tous les utilisateurs TBA confirmés et non désabonnés (OF, ML, ARML, …, hors administrateurs). Segmentation côté Brevo via les attributs cfa_* et ml_*.",
  brevoFolderId: config.brevo.campaignFolderId,
  brevoListId: config.brevo.tbaContactsListId,
  attributesSchema: tbaContactsAttributesSchema,
  buildListName,
  fetchContacts,
};
