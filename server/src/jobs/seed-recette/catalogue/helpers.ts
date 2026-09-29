import type { ObjectId } from "mongodb";
import type { IMissionLocaleEffectif } from "shared/models";
import {
  type ACC_CONJOINT_MOTIF_ENUM,
  CFA_SITUATION_TYPE_ENUM,
  CONNAISSANCE_ML_ENUM,
  type CFA_RISQUE_RUPTURE_ENUM,
  type SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";

import { computeSuiviDatesSet } from "@/common/actions/mission-locale/mission-locale-suivi-dates";

import {
  buildDossierMl,
  buildEffectifDeca,
  buildEffectifErp,
  buildLog,
  buildPersonne,
  jour,
  type SeedContext,
  type SeedParcoursInput,
  type SeedPersonne,
} from "../factories";
import type { CfaHostCode, MlHostCode } from "../hosts";

import type { SeedDocs } from "./types";

export interface RuptureInput {
  n: number;
  cfa: CfaHostCode;
  ml?: MlHostCode;
  age?: number;
  rqth?: boolean;
  dateDeNaissance?: Date;
  deca?: boolean;
  joursDepuisRupture?: number;
  parcours?: SeedParcoursInput;
  createdAt?: Date;
  dossier?: Partial<IMissionLocaleEffectif>;
}

export function parcoursRupture(ctx: SeedContext, joursDepuisRupture: number): SeedParcoursInput {
  const dateEntree = jour(ctx, -(joursDepuisRupture + 240));
  return {
    dateEntree,
    dateFin: jour(ctx, 400),
    contrats: [
      { debut: jour(ctx, -(joursDepuisRupture + 230)), fin: jour(ctx, 400), rupture: jour(ctx, -joursDepuisRupture) },
    ],
  };
}

export function parcoursEnContrat(ctx: SeedContext): SeedParcoursInput {
  return {
    dateEntree: jour(ctx, -300),
    dateFin: jour(ctx, 400),
    contrats: [{ debut: jour(ctx, -290), fin: jour(ctx, 400) }],
  };
}

export interface Rupture {
  personne: SeedPersonne;
  dossier: IMissionLocaleEffectif;
  docs: Partial<SeedDocs>;
}

export async function rupture(ctx: SeedContext, input: RuptureInput): Promise<Rupture> {
  const ml = input.ml ?? "ML_A";
  const personne = buildPersonne(ctx, {
    n: input.n,
    age: input.age ?? 20,
    rqth: input.rqth,
    dateDeNaissance: input.dateDeNaissance,
  });
  const effectifInput = {
    n: input.n,
    cfa: input.cfa,
    ml,
    personne,
    parcours: input.parcours ?? parcoursRupture(ctx, input.joursDepuisRupture ?? 60),
  };

  if (input.deca) {
    const effectif = await buildEffectifDeca(ctx, effectifInput);
    const dossier = buildDossierMl(ctx, {
      n: input.n,
      effectif,
      ml,
      cfa: input.cfa,
      createdAt: input.createdAt,
      overrides: input.dossier,
    });
    return { personne, dossier, docs: { effectifsDeca: [effectif], dossiers: [dossier] } };
  }

  const effectif = await buildEffectifErp(ctx, effectifInput);
  const dossier = buildDossierMl(ctx, {
    n: input.n,
    effectif,
    ml,
    cfa: input.cfa,
    createdAt: input.createdAt,
    overrides: input.dossier,
  });
  return { personne, dossier, docs: { effectifs: [effectif], dossiers: [dossier] } };
}

export interface EtapeMl {
  jour: number;
  par: ObjectId | null;
  situation: SITUATION_ENUM;
  connaissance_ml?: CONNAISSANCE_ML_ENUM;
  situation_autre?: string;
  commentaires?: string;
  probleme_type?: IMissionLocaleEffectif["probleme_type"];
  probleme_detail?: string;
}

export function traiter(
  ctx: SeedContext,
  dossier: IMissionLocaleEffectif,
  etapes: EtapeMl[],
  premierLog: number
): IMissionLocaleEffectifLog[] {
  return etapes.map((etape, i) => {
    const date = jour(ctx, etape.jour);
    const { jour: _jour, par, ...champs } = etape;
    const dejaConnu =
      champs.connaissance_ml !== undefined ? champs.connaissance_ml !== CONNAISSANCE_ML_ENUM.NON_CONNU : undefined;

    Object.assign(dossier, champs, computeSuiviDatesSet(champs.situation, true, date), {
      ...(dejaConnu !== undefined ? { deja_connu: dejaConnu } : {}),
      updated_at: date,
    });
    if (dossier.organisme_data?.acc_conjoint) {
      dossier.organisme_data.has_unread_notification = true;
    }

    return buildLog({
      n: premierLog + i,
      dossierId: dossier._id,
      createdAt: date,
      created_by: par,
      ...champs,
      ...(dejaConnu !== undefined ? { deja_connu: dejaConnu } : {}),
    });
  });
}

type OrganismeData = NonNullable<IMissionLocaleEffectif["organisme_data"]>;

export interface CollaborationCfa {
  jour: number;
  par: ObjectId;
  situationType: CFA_SITUATION_TYPE_ENUM;
  motifs: ACC_CONJOINT_MOTIF_ENUM[];
  commentaires: string;
  risque?: CFA_RISQUE_RUPTURE_ENUM;
  toujoursAuCfa?: boolean;
  causeRupture?: string;
  jourRupture?: number;
  jourAbandon?: number;
  complement?: Partial<OrganismeData>;
}

export function collaborer(ctx: SeedContext, dossier: IMissionLocaleEffectif, c: CollaborationCfa) {
  const date = jour(ctx, c.jour);
  const enRupture = c.situationType === CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE;

  dossier.organisme_data = {
    rupture: enRupture,
    acc_conjoint: true,
    motif: c.motifs,
    commentaires: c.commentaires,
    reponse_at: date,
    has_unread_notification: false,
    acc_conjoint_by: c.par,
    acc_conjoint_at: date,
    situation_type: c.situationType,
    referent_type: "me",
    ...(c.risque ? { risque_rupture: c.risque } : {}),
    ...(c.toujoursAuCfa !== undefined ? { still_at_cfa: c.toujoursAuCfa } : {}),
    ...(c.causeRupture ? { cause_rupture: c.causeRupture } : {}),
    ...(c.jourAbandon !== undefined ? { date_abandon: jour(ctx, c.jourAbandon) } : {}),
    ...c.complement,
  };

  if (c.jourRupture !== undefined) {
    const dateRupture = jour(ctx, c.jourRupture);
    dossier.cfa_rupture_declaration = { date_rupture: dateRupture, declared_at: date, declared_by: c.par };
    dossier.date_rupture = dateRupture;
  }
  dossier.updated_at = date;
}
