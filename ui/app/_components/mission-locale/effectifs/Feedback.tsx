"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { IUpdateMissionLocaleEffectif, SITUATION_LABEL_ENUM } from "shared";

import styles from "./Feedback.module.css";

export function Feedback({ situation }: { situation: IUpdateMissionLocaleEffectif }) {
  return (
    <div className={styles.feedbackContainer}>
      <p className="fr-mb-1v">
        <b>Quel est votre retour sur la prise de contact ?</b>
      </p>
      <div className={styles.feedbackSituationContainer}>
        <Tag>{situation.situation ? SITUATION_LABEL_ENUM[situation.situation] : "Situation inconnue"}</Tag>
        {situation.situation === "AUTRE" && <p className={styles.feedbackText}>({situation.situation_autre})</p>}
      </div>

      <p className="fr-mb-1v">
        <b>Ce jeune était-il déjà connu de votre Mission Locale ?</b>
      </p>
      <Tag>{situation.deja_connu ? "Oui" : "Non"}</Tag>

      <p className="fr-mb-1v">
        <b>Commentaires</b>
      </p>
      <p className={styles.feedbackText}>{situation.commentaires || "Aucun commentaire"}</p>
    </div>
  );
}
