import type { IMissionLocaleEffectif, IUsersMigration } from "shared/models";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";

import type { SeedContext } from "../factories";
import type { MlHostCode } from "../hosts";

export interface SeedDocs {
  effectifs: IEffectif[];
  effectifsDeca: IEffectifDECA[];
  dossiers: IMissionLocaleEffectif[];
  logs: IMissionLocaleEffectifLog[];
  users: IUsersMigration[];
}

export type ListeMl = "a_traiter_ou_recontacter" | "traite";

export type IndicateurMl =
  | "a_traiter"
  | "injoignable"
  | "nouveau_contrat"
  | "mineur"
  | "prioritaire"
  | "relance_urgente"
  | "souhaite_rdv";

export interface AttenduMl {
  ml: MlHostCode;
  liste: ListeMl | null;
  dansPrioritaires?: boolean;
  indicateurs?: Partial<Record<IndicateurMl, boolean>>;
}

export interface SeedCase {
  n: number;
  code: string;
  titre: string;
  attendu: { ml?: AttenduMl };
  build: (ctx: SeedContext) => Promise<Partial<SeedDocs>>;
}

export const emptyDocs = (): SeedDocs => ({ effectifs: [], effectifsDeca: [], dossiers: [], logs: [], users: [] });

export function mergeDocs(target: SeedDocs, source: Partial<SeedDocs>) {
  target.effectifs.push(...(source.effectifs ?? []));
  target.effectifsDeca.push(...(source.effectifsDeca ?? []));
  target.dossiers.push(...(source.dossiers ?? []));
  target.logs.push(...(source.logs ?? []));
  target.users.push(...(source.users ?? []));
}
