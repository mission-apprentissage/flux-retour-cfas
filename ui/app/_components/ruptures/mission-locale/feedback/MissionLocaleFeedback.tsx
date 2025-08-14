"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { IUpdateMissionLocaleEffectif, SITUATION_LABEL_ENUM, PROBLEME_TYPE_ENUM, SITUATION_ENUM } from "shared";
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
        {sortedLogs.map((log, index) => (
          <div key={log._id.toString()}>
            <>
              {log.created_at && log.situation && (
                <h3 className="fr-mb-2v" style={{ fontSize: "20px" }}>
                  Retour / Action de la Mission Locale le {formatDate(log.created_at)},{" "}
                  {formatContactTimeText(calculateDaysSince(log.created_at))}
                </h3>
              )}

              {(() => {
                if (log.situation === SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES) {
                  return (
                    <div className={styles.feedbackContainer}>
                      <p className="fr-mb-0">
                        <b>Ce jeune est resté injoignable.</b>
                      </p>
                    </div>
                  );
                }

                const isSecondAttemptOrMore = index < sortedLogs.length - 1 && log.probleme_type;

                if (isSecondAttemptOrMore) {
                  return (
                    <div className={styles.feedbackContainer}>
                      <p className="fr-mb-1v fr-mt-3v">
                        <b>La Mission Locale a t-elle pu rentrer en contact avec le jeune ?</b>
                      </p>
                      <Tag>{log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR ? "Non" : "Oui"}</Tag>

                      {log.probleme_type && (
                        <>
                          <p className="fr-mb-1v fr-mt-3v">
                            <b>Quel était le problème selon elle ?</b>
                          </p>
                          <Tag>
                            {log.probleme_type === PROBLEME_TYPE_ENUM.COORDONNEES_INCORRECTES &&
                              "Coordonnées incorrectes"}
                            {log.probleme_type === PROBLEME_TYPE_ENUM.JEUNE_INJOIGNABLE && "Le jeune est injoignable"}
                            {log.probleme_type === PROBLEME_TYPE_ENUM.AUTRE && `Autre - ${log.probleme_detail}`}
                          </Tag>
                        </>
                      )}

                      <p className="fr-mb-1v fr-mt-3v">
                        <b>Elle a décidé de</b>
                      </p>
                      <Tag>
                        {log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR ? (
                          <>
                            Garder le jeune dans la liste{" "}
                            <span className="fr-badge fr-badge--purple-glycine" style={{ marginLeft: "0.5rem" }}>
                              <i className="fr-icon-phone-fill fr-icon--sm" />
                              <span style={{ marginLeft: "5px" }}>
                                <b>À RECONTACTER</b>
                              </span>
                            </span>
                          </>
                        ) : (
                          <>
                            Marquer le dossier du jeune comme <Badge severity="success">traité</Badge>
                          </>
                        )}
                      </Tag>
                    </div>
                  );
                }

                return (
                  <div className={styles.feedbackContainer}>
                    <p className="fr-mb-1v fr-mt-3v">
                      <b>Quel est le retour sur la prise de contact ?</b>
                    </p>
                    <Tag>{log.situation ? SITUATION_LABEL_ENUM[log.situation] : "Situation inconnue"}</Tag>

                    {log.commentaires && (
                      <>
                        <p className="fr-mb-1v fr-mt-3v">
                          <b>Commentaires</b>
                        </p>
                        <p className={styles.feedbackText}>{log?.commentaires}</p>
                      </>
                    )}
                  </div>
                );
              })()}
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
            {(() => {
              if (log.situation === SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES) {
                return (
                  <div className={styles.feedbackContainer}>
                    <p className="fr-mb-0">
                      <b>Ce jeune est resté injoignable.</b>
                    </p>
                  </div>
                );
              }

              const isSecondAttemptOrMore = index < sortedLogs.length - 1 && log.probleme_type;
              if (isSecondAttemptOrMore) {
                return (
                  <div className={styles.feedbackContainer}>
                    <p className="fr-mb-1v">
                      <b>Avez-vous pu rentrer en contact avec le jeune ?</b>
                    </p>
                    <Tag>{log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR ? "Non" : "Oui"}</Tag>

                    {log.probleme_type && (
                      <>
                        <p className="fr-mb-1v fr-mt-3v">
                          <b>Quel était le problème selon vous ?</b>
                        </p>
                        <div className={styles.feedbackSituationContainer}>
                          <Tag>
                            {log.probleme_type === PROBLEME_TYPE_ENUM.COORDONNEES_INCORRECTES &&
                              "Coordonnées incorrectes"}
                            {log.probleme_type === PROBLEME_TYPE_ENUM.JEUNE_INJOIGNABLE && "Le jeune est injoignable"}
                            {log.probleme_type === PROBLEME_TYPE_ENUM.AUTRE && `Autre - ${log.probleme_detail}`}
                          </Tag>
                        </div>
                      </>
                    )}

                    <p className="fr-mb-1v fr-mt-3v">
                      <b>Vous avez décidé</b>
                    </p>
                    <Tag>
                      {log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR ? (
                        <>
                          Garder le jeune dans la liste{" "}
                          <span className="fr-badge fr-badge--purple-glycine" style={{ marginLeft: "0.5rem" }}>
                            <i className="fr-icon-phone-fill fr-icon--sm" />
                            <span style={{ marginLeft: "5px" }}>À RECONTACTER</span>
                          </span>
                        </>
                      ) : (
                        <>
                          Marquer le dossier du jeune comme{" "}
                          <Badge as="span" style={{ marginLeft: "5px" }} severity="success">
                            traité
                          </Badge>
                        </>
                      )}
                    </Tag>
                  </div>
                );
              }

              return (
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
              );
            })()}
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
