import { ACC_CONJOINT_MOTIF_ENUM } from "shared";

import { VerifiedInfo } from "./hooks";

export type FormValues = {
  still_at_cfa: boolean | null;
  motifs: ACC_CONJOINT_MOTIF_ENUM[];
  commentaires_par_motif: Partial<Record<ACC_CONJOINT_MOTIF_ENUM, string>>;
  cause_rupture: string;
  referent_type: "me" | "other" | null;
  referent_details: string;
  verified_info: VerifiedInfo;
  note_complementaire: string;
};

export type VerifiedField = {
  key: keyof VerifiedInfo;
  label: string;
  required: boolean;
  isAddress?: boolean;
};
