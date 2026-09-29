import { randomUUID } from "node:crypto";

import { addDays, subDays, subYears } from "date-fns";
import type { ObjectId, WithoutId } from "mongodb";
import { CGU_VERSION } from "shared/constants";
import type {
  IMissionLocaleEffectif,
  IOrganisationMissionLocale,
  IOrganisationOrganismeFormation,
  IOrganisme,
  IUsersMigration,
} from "shared/models";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import { getAnneeScolaireFromDate } from "shared/utils";

import { withComputedFields } from "@/common/actions/effectifs.actions";
import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";
import { getCurrentStatutFromParcours } from "@/common/actions/shared/rupture-pipeline.utils";
import { organisationsDb, organismesDb } from "@/common/model/collections";
import { hash } from "@/common/utils/passwordUtils";
import config from "@/config";

import {
  CFA_HOST_CODES,
  type CfaHostCode,
  ML_HOST_CODES,
  ML_HOST_COMMUNES,
  type MlHostCode,
  type SeedRecetteHosts,
} from "./hosts";
import { seedId } from "./seed-ids";

export const SEED_EMAIL_DOMAIN = "seed.recette.invalid";
export const SEED_MARKER = "SEED_RECETTE";

const PRENOMS = [
  "Camille",
  "Sacha",
  "Alix",
  "Charlie",
  "Eden",
  "Lou",
  "Noa",
  "Maxime",
  "Andréa",
  "Morgan",
  "Yaël",
  "Élie",
  "Louison",
  "Ambre",
  "Gabin",
  "Inès",
];

const FORMATION = {
  cfd: "50022141",
  rncp: "RNCP4637",
  libelle_long: "CAP MAINTENANCE DES VEHICULES OPTION VOITURES PARTICULIERES",
  libelle_court: "CAP MAINT.VEHIC.OPT.VEHIC.LEGERS",
  niveau: "3",
  niveau_libelle: "3 (CAP, BEP...)",
};

export interface SeedCfa {
  organisme: IOrganisme;
  organisation: IOrganisationOrganismeFormation;
}

export interface SeedContext {
  now: Date;
  today: Date;
  missionsLocales: Record<MlHostCode, IOrganisationMissionLocale>;
  cfas: Record<CfaHostCode, SeedCfa>;
  passwordHash: string;
}

export async function loadSeedContext(hosts: SeedRecetteHosts, now: Date): Promise<SeedContext> {
  const missionsLocales = {} as Record<MlHostCode, IOrganisationMissionLocale>;
  for (const code of ML_HOST_CODES) {
    missionsLocales[code] = (await organisationsDb().findOne({
      _id: hosts.missionsLocales[code],
    })) as IOrganisationMissionLocale;
  }

  const cfas = {} as Record<CfaHostCode, SeedCfa>;
  for (const code of CFA_HOST_CODES) {
    const { organisationId, organismeId } = hosts.cfas[code];
    cfas[code] = {
      organisation: (await organisationsDb().findOne({ _id: organisationId })) as IOrganisationOrganismeFormation,
      organisme: (await organismesDb().findOne({ _id: organismeId })) as IOrganisme,
    };
  }

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const password = config.seedRecette.password || randomUUID();

  return { now, today, missionsLocales, cfas, passwordHash: hash(password) };
}

export const jour = (ctx: SeedContext, offset: number) => addDays(ctx.today, offset);

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export interface SeedPersonne {
  nom: string;
  prenom: string;
  date_de_naissance: Date;
  sexe: "M" | "F";
  telephone: string;
  courriel: string;
  rqth: boolean;
}

export interface SeedPersonneInput {
  n: number;
  nom: string;
  age: number;
  rqth?: boolean;
}

export function buildPersonne(ctx: SeedContext, { n, nom, age, rqth = false }: SeedPersonneInput): SeedPersonne {
  const prenom = PRENOMS[n % PRENOMS.length];
  return {
    nom,
    prenom,
    date_de_naissance: subDays(subYears(ctx.today, age), 30 + (n % 300)),
    sexe: n % 2 === 0 ? "F" : "M",
    telephone: `063998${String(n).padStart(4, "0")}`,
    courriel: `${slug(prenom)}.${slug(nom)}@${SEED_EMAIL_DOMAIN}`,
    rqth,
  };
}

export interface SeedContratInput {
  debut: Date;
  fin: Date;
  rupture?: Date;
  causeRupture?: string;
}

export interface SeedParcoursInput {
  dateEntree: Date;
  dateFin: Date;
  dateExclusion?: Date;
  contrats: SeedContratInput[];
}

export interface SeedEffectifInput {
  n: number;
  cfa: CfaHostCode;
  ml: MlHostCode;
  personne: SeedPersonne;
  parcours: SeedParcoursInput;
}

function buildEffectifBase(ctx: SeedContext, { n, cfa, ml, personne, parcours }: SeedEffectifInput) {
  const { organisme } = ctx.cfas[cfa];
  const communes = ML_HOST_COMMUNES[ml];
  const commune = communes[n % communes.length];
  const anneeScolaire = getAnneeScolaireFromDate(parcours.dateEntree);
  const [debut, fin] = anneeScolaire.split("-").map(Number);

  return {
    organisme_id: organisme._id,
    organisme_responsable_id: organisme._id,
    organisme_formateur_id: organisme._id,
    id_erp_apprenant: `${SEED_MARKER}_${n}`,
    source_organisme_id: SEED_MARKER,
    annee_scolaire: anneeScolaire,
    apprenant: {
      nom: personne.nom,
      prenom: personne.prenom,
      date_de_naissance: personne.date_de_naissance,
      sexe: personne.sexe,
      courriel: personne.courriel,
      telephone: personne.telephone,
      rqth: personne.rqth,
      has_nir: false,
      historique_statut: [],
      adresse: {
        numero: 1 + (n % 90),
        voie: "Rue de la Recette",
        ...commune,
        mission_locale_id: ctx.missionsLocales[ml].ml_id,
      },
    },
    formation: {
      ...FORMATION,
      periode: [debut, fin],
      date_inscription: parcours.dateEntree,
      date_entree: parcours.dateEntree,
      date_fin: parcours.dateFin,
      ...(parcours.dateExclusion ? { date_exclusion: parcours.dateExclusion } : {}),
    },
    contrats: parcours.contrats.map((c) => ({
      date_debut: c.debut,
      date_fin: c.fin,
      date_rupture: c.rupture ?? null,
      ...(c.causeRupture ? { cause_rupture: c.causeRupture } : {}),
    })),
    is_lock: false,
    validation_errors: [],
    created_at: ctx.now,
    updated_at: ctx.now,
    transmitted_at: ctx.now,
  };
}

export async function buildEffectifErp(ctx: SeedContext, input: SeedEffectifInput): Promise<IEffectif> {
  const effectif = await withComputedFields(
    { ...buildEffectifBase(ctx, input), source: "ERP" } as WithoutId<IEffectif>,
    { organisme: ctx.cfas[input.cfa].organisme, certification: null }
  );
  return { ...effectif, _id: seedId("effectif", input.n) };
}

export async function buildEffectifDeca(
  ctx: SeedContext,
  input: SeedEffectifInput & { decaCompatible?: boolean }
): Promise<IEffectifDECA> {
  const effectif = await withComputedFields(
    {
      ...buildEffectifBase(ctx, input),
      source: "DECA",
      deca_raw_id: seedId("decaRaw", input.n),
      is_deca_compatible: input.decaCompatible ?? true,
    } as WithoutId<IEffectifDECA>,
    { organisme: ctx.cfas[input.cfa].organisme, certification: null }
  );
  return { ...effectif, _id: seedId("effectifDeca", input.n) };
}

export interface SeedDossierMlInput {
  n: number;
  effectif: IEffectif | IEffectifDECA;
  ml: MlHostCode;
  cfa: CfaHostCode;
  createdAt?: Date;
  overrides?: Partial<IMissionLocaleEffectif>;
}

export function buildDossierMl(
  ctx: SeedContext,
  { n, effectif, ml, cfa, createdAt, overrides = {} }: SeedDossierMlInput
): IMissionLocaleEffectif {
  const parcours = effectif._computed?.statut?.parcours ?? [];
  const current = getCurrentStatutFromParcours(parcours, ctx.now);
  const derniereRupture = parcours.filter((s) => s.valeur === "RUPTURANT" && s.date <= ctx.now).at(-1);
  const dateRupture = derniereRupture?.date ?? current?.date ?? null;
  const created = createdAt ?? (dateRupture ? minDate(addDays(dateRupture, 1), ctx.now) : ctx.now);

  const { organisme, organisation } = ctx.cfas[cfa];
  const missionLocale = ctx.missionsLocales[ml];
  const { nom, prenom, date_de_naissance } = effectif.apprenant;

  return {
    _id: seedId("dossierMl", n),
    mission_locale_id: missionLocale._id,
    effectif_id: effectif._id,
    effectif_snapshot: { ...effectif },
    effectif_snapshot_date: created,
    date_rupture: dateRupture,
    created_at: created,
    updated_at: created,
    current_status: { value: current?.valeur ?? null, date: current?.date ?? null },
    identifiant_normalise: normalisePersonIdentifiant({ nom, prenom, date_de_naissance: date_de_naissance as Date }),
    computed: {
      organisme: {
        ml_beta_activated_at: organisation.ml_beta_activated_at,
        is_allowed_collab: organisme.is_allowed_collab ?? false,
        ...(organisme.collab_suspended_at ? { collab_suspended_at: organisme.collab_suspended_at } : {}),
        ...(organisme.collab_resumed_at ? { collab_resumed_at: organisme.collab_resumed_at } : {}),
      },
      ...(missionLocale.activated_at ? { mission_locale: { activated_at: missionLocale.activated_at } } : {}),
    },
    ...overrides,
  } as IMissionLocaleEffectif;
}

const minDate = (a: Date, b: Date) => (a < b ? a : b);

export interface SeedLogInput extends Partial<Omit<IMissionLocaleEffectifLog, "_id" | "mission_locale_effectif_id">> {
  n: number;
  dossierId: ObjectId;
  createdAt: Date;
}

export function buildLog({ n, dossierId, createdAt, ...fields }: SeedLogInput): IMissionLocaleEffectifLog {
  return {
    read_by: [],
    created_by: null,
    ...fields,
    _id: seedId("log", n),
    mission_locale_effectif_id: dossierId,
    created_at: createdAt,
  };
}

export interface SeedUserInput {
  n: number;
  organisationId: ObjectId;
  prenom: string;
  nom: string;
  fonction: string;
  role?: "admin" | "member";
  lastConnection?: Date;
}

export function buildUser(
  ctx: SeedContext,
  { n, organisationId, prenom, nom, fonction, role, lastConnection }: SeedUserInput
): IUsersMigration {
  const createdAt = jour(ctx, -200);
  return {
    _id: seedId("user", n),
    email: `${slug(prenom)}.${slug(nom)}@${SEED_EMAIL_DOMAIN}`,
    password: ctx.passwordHash,
    civility: n % 2 === 0 ? "Madame" : "Monsieur",
    nom,
    prenom,
    fonction,
    telephone: "0199001234",
    organisation_id: organisationId,
    ...(role ? { organisation_role: role } : {}),
    account_status: "CONFIRMED",
    has_accept_cgu_version: CGU_VERSION,
    created_at: createdAt,
    confirmed_at: createdAt,
    password_updated_at: createdAt,
    connection_history: lastConnection ? [lastConnection] : [],
    ...(lastConnection ? { last_connection: lastConnection } : {}),
    emails: [],
  };
}
