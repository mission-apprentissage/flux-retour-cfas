"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { IUpdateMissionLocaleEffectif, SITUATION_LABEL_ENUM } from "shared";
import { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";

import { formatDate } from "@/app/_utils/date.utils";

import { calculateDaysSince, formatContactTimeText } from "../../shared";
import styles from "../../shared/ui/Feedback.module.css";

interface MissionLocaleFeedbackProps {
  situation: IUpdateMissionLocaleEffectif;
  visibility: "ORGANISME_FORMATION" | "MISSION_LOCALE" | "ADMINISTRATEUR";
  logs?: Array<IMissionLocaleEffectifLog> | null;
}

export function MissionLocaleFeedback({ visibility, logs }: MissionLocaleFeedbackProps) {
  if (!logs?.length) {
    return null;
  }
  const sortedLogs = logs?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  const organismeFormationLayout = () => {
    return (
      <>
        {sortedLogs.map((log) => (
          <div key={log._id.toString()}>
            <>
              {log.created_at && log.situation && (
                <h4 className="fr-mb-2v">
                  Retour / Action de la Mission Locale le {formatDate(log.created_at)},{" "}
                  {formatContactTimeText(calculateDaysSince(log.created_at))}
                </h4>
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
      <>
        {sortedLogs.map((log, index) => (
          <div key={index}>
            <h6 className="fr-mb-2v">
              Le {formatDate(log.created_at)}, {formatContactTimeText(calculateDaysSince(log.created_at))}
            </h6>
            <div className={styles.feedbackContainer}>
              <p className="fr-mb-1v">
                <b>Quel est votre retour sur la prise de contact ?</b>
              </p>
              <div className={styles.feedbackSituationContainer}>
                <Tag>{log.situation ? SITUATION_LABEL_ENUM[log.situation] : "Situation inconnue"}</Tag>
                {log.situation === "AUTRE" && <p className={styles.feedbackText}>({log.situation_autre})</p>}
              </div>
              {index === sortedLogs.length - 1 && (
                <>
                  <p className="fr-mb-1v">
                    <b>Ce jeune était-il déjà connu de votre Mission Locale ?</b>
                  </p>
                  <Tag>{log.deja_connu ? "Oui" : "Non"}</Tag>
                </>
              )}

              {log.commentaires ? (
                <>
                  <p className="fr-mb-1v">
                    <b>Commentaires</b>
                  </p>
                  <p className={styles.feedbackText}>{log.commentaires}</p>
                </>
              ) : null}
            </div>
          </div>
        ))}
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
