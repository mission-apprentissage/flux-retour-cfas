import { ACC_CONJOINT_MOTIF_ENUM } from "shared";

import { VerifiedField } from "./types";

export const FREINS_MOTIFS: ACC_CONJOINT_MOTIF_ENUM[] = [
  ACC_CONJOINT_MOTIF_ENUM.LOGEMENT,
  ACC_CONJOINT_MOTIF_ENUM.MOBILITE,
  ACC_CONJOINT_MOTIF_ENUM.SANTE,
  ACC_CONJOINT_MOTIF_ENUM.ADMINISTRATIF,
  ACC_CONJOINT_MOTIF_ENUM.FINANCE,
  ACC_CONJOINT_MOTIF_ENUM.SOCIAL_FAMILIAL,
];

export const VERIFIED_FIELDS: VerifiedField[] = [
  { key: "telephone", label: "Téléphone", required: true },
  { key: "courriel", label: "Courriel", required: false },
  { key: "adresse_rue", label: "Adresse postale", required: true, isAddress: true },
  { key: "formation_libelle", label: "Intitulé de formation", required: true },
  { key: "date_fin_formation", label: "Date de fin de période de maintien en formation", required: true },
];
