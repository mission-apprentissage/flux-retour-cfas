"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { ML_SITUATION_DOSSIER, ML_SITUATION_DOSSIER_LABEL } from "shared/constants";

import { ML_SITUATION_TOOLTIPS } from "../ui/situationTooltips";

import styles from "./CollaborationDetail.shared.module.css";

export function SituationDossierTag({ situation }: { situation: ML_SITUATION_DOSSIER }) {
  return (
    <span className={styles.situationTag}>
      {ML_SITUATION_DOSSIER_LABEL[situation]}
      <Tooltip kind="hover" title={ML_SITUATION_TOOLTIPS[situation]} />
    </span>
  );
}
