import type { IMissionLocaleEffectif, IUsersMigration } from "shared/models";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleCfaInvitation } from "shared/models/data/missionLocaleCfaInvitations.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import type { CfaCollaborationStatus } from "shared/models/routes/organismes/cfa/cfa.api";

import type { SeedContext } from "../factories";
import type { CfaHostCode, MlHostCode } from "../hosts";

export interface SeedDocs {
  effectifs: IEffectif[];
  effectifsDeca: IEffectifDECA[];
  dossiers: IMissionLocaleEffectif[];
  logs: IMissionLocaleEffectifLog[];
  users: IUsersMigration[];
  invitations: IMissionLocaleCfaInvitation[];
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
  dansCollaborations?: boolean;
  indicateurs?: Partial<Record<IndicateurMl, boolean>> & { situation_dossier?: string | null };
}

export interface AttenduCfa {
  cfa: CfaHostCode;
  ruptures: "moins_45j" | "plus_45j" | null;
  collabStatus?: CfaCollaborationStatus;
  suivi?: "collab" | "hors_collab" | null;
  dansEffectifs?: boolean;
  statutEffectif?: string;
}

export interface SeedCase {
  n: number;
  code: string;
  titre: string;
  source?: "DECA";
  attendu: { ml?: AttenduMl; cfa?: AttenduCfa };
  build: (ctx: SeedContext) => Promise<Partial<SeedDocs>>;
}

export const emptyDocs = (): SeedDocs => ({
  effectifs: [],
  effectifsDeca: [],
  dossiers: [],
  logs: [],
  users: [],
  invitations: [],
});

export function mergeDocs(target: SeedDocs, source: Partial<SeedDocs>) {
  target.effectifs.push(...(source.effectifs ?? []));
  target.effectifsDeca.push(...(source.effectifsDeca ?? []));
  target.dossiers.push(...(source.dossiers ?? []));
  target.logs.push(...(source.logs ?? []));
  target.users.push(...(source.users ?? []));
  target.invitations.push(...(source.invitations ?? []));
}
