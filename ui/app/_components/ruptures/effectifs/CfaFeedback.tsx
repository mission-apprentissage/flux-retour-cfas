"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { ACC_CONJOINT_MOTIF_ENUM } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "./Feedback.module.css";

interface CfaFeedbackProps {
  organismeData: {
    rupture?: boolean | null;
    acc_conjoint?: boolean | null;
    motif?: string[] | null;
    commentaires?: string | null;
  };
  transmittedAt?: Date | null;
  visibility: "ORGANISME_FORMATION" | "MISSION_LOCALE" | "ADMINISTRATEUR";
}

const MOTIF_LABELS = {
  [ACC_CONJOINT_MOTIF_ENUM.MOBILITE]: "Mobilité",
  [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT]: "Logement",
  [ACC_CONJOINT_MOTIF_ENUM.SANTE]: "Santé",
  [ACC_CONJOINT_MOTIF_ENUM.FINANCE]: "Finance",
  [ACC_CONJOINT_MOTIF_ENUM.ADMINISTRATIF]: "Administratif",
  [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION]: "Réorientation",
  [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]: "Recherche d'emploi",
  [ACC_CONJOINT_MOTIF_ENUM.AUTRE]: "Autre",
};

export function CfaFeedback({ organismeData, transmittedAt, visibility }: CfaFeedbackProps) {
  const missionLocaleLayout = () => {
    return (
      <>
        <div className={styles.effectifFeedbackContainer}>
          <div className="fr-mb-2v">
            <b>Problématiques rencontrées par le jeune :</b>
          </div>
          <div className="fr-mb-2v">
            {organismeData?.motif?.map((motif, index) => (
              <Tag key={index} className={styles.effectifFeedbackTag}>
                <b>{MOTIF_LABELS[motif] || motif}</b>
              </Tag>
            ))}
          </div>
          <div className="fr-mb-2v">{organismeData.commentaires}</div>
        </div>
      </>
    );
  };

  const organismeFormationLayout = () => {
    return (
      <>
        {transmittedAt && organismeData.rupture && organismeData.acc_conjoint && (
          <h4 className="fr-mb-2v">Dossier partagé à la Mission Locale le {formatDate(transmittedAt)}</h4>
        )}

        <div className={styles.feedbackContainer}>
          <p className="fr-mb-1v fr-mt-3v">
            <b>Ce jeune est-il toujours en rupture de contrat d&apos;apprentissage ?</b>
          </p>
          <Tag>
            <b>{organismeData.rupture ? "Oui" : "Non"}</b>
          </Tag>

          {organismeData.rupture && (
            <>
              <p className="fr-mb-1v fr-mt-3v">
                <b>Souhaitez-vous démarrer un accompagnement conjoint avec la Mission Locale ?</b>
              </p>
              <Tag>
                <b>{organismeData.acc_conjoint ? "Oui" : "Non"}</b>
              </Tag>

              {organismeData.acc_conjoint && organismeData.motif && organismeData.motif.length > 0 && (
                <>
                  <p className="fr-mb-1v fr-mt-3v">
                    <b>Pour quelle(s) problématique(s) ?</b>
                  </p>
                  <div className={styles.feedbackSituationContainer}>
                    {organismeData.motif.map((motif, index) => (
                      <Tag key={index}>
                        <b>{MOTIF_LABELS[motif] || motif}</b>
                      </Tag>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {organismeData.commentaires && (
            <>
              <p className="fr-mb-1v fr-mt-3v">
                <b>Commentaires</b>
              </p>
              <p className={styles.feedbackText}>
                <b>{organismeData.commentaires}</b>
              </p>
            </>
          )}
        </div>
      </>
    );
  };

  switch (visibility) {
    case "ADMINISTRATEUR":
    case "ORGANISME_FORMATION":
      return organismeFormationLayout();
    case "MISSION_LOCALE":
      return missionLocaleLayout();
    default:
      return null;
  }
}
