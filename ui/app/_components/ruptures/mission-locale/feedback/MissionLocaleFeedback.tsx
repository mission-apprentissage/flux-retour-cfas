"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { IUpdateMissionLocaleEffectif, SITUATION_LABEL_ENUM } from "shared";
import { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "../../shared/ui/Feedback.module.css";

interface MissionLocaleFeedbackProps {
  situation: IUpdateMissionLocaleEffectif;
  visibility: "ORGANISME_FORMATION" | "MISSION_LOCALE" | "ADMINISTRATEUR";
  logs?: Array<IMissionLocaleEffectifLog> | null;
}

export function MissionLocaleFeedback({ situation, visibility, logs }: MissionLocaleFeedbackProps) {
  if (!situation.situation) {
    return null;
  }

  const organismeFormationLayout = () => {
    return (
      <>
        {logs?.map((log) => (
          <div key={log._id.toString()}>
            <>
              {log.created_at && log.situation && (
                <h4 className="fr-mb-2v">Retour / Action de la Mission Locale le {formatDate(log.created_at)}</h4>
              )}

              <div className={styles.feedbackContainer}>
                <p className="fr-mb-1v fr-mt-3v">
                  <b>Quel est le retour sur la prise de contact ?</b>
                </p>
                <Tag>
                  <b>{log.situation ? SITUATION_LABEL_ENUM[log.situation] : "Situation inconnue"}</b>
                </Tag>

                {log.commentaires && (
                  <>
                    <p className="fr-mb-1v fr-mt-3v">
                      <b>Commentaires</b>
                    </p>
                    <p className={styles.feedbackText}>
                      <b>{log?.commentaires}</b>
                    </p>
                  </>
                )}
              </div>
            </>
          </div>
        ))}
      </>
    );
  };

  const missionLocaleLayout = () => {
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
