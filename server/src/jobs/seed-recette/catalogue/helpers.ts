import type { ObjectId } from "mongodb";
import type { IMissionLocaleEffectif } from "shared/models";
import { CONNAISSANCE_ML_ENUM, type SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
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
  nom: string;
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

export interface Rupture {
  personne: SeedPersonne;
  dossier: IMissionLocaleEffectif;
  docs: Partial<SeedDocs>;
}

export async function rupture(ctx: SeedContext, input: RuptureInput): Promise<Rupture> {
  const ml = input.ml ?? "ML_A";
  const personne = buildPersonne(ctx, {
    n: input.n,
    nom: input.nom,
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
