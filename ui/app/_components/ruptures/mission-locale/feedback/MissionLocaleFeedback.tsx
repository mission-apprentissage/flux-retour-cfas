"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { IUpdateMissionLocaleEffectif, SITUATION_LABEL_ENUM, PROBLEME_TYPE_ENUM, SITUATION_ENUM } from "shared";
import { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import { IWhatsAppContact } from "shared/models/data/whatsappContact.model";

import { formatDate, formatDateWithTime } from "@/app/_utils/date.utils";

import { calculateDaysSince, formatContactTimeText } from "../../shared";
import styles from "../../shared/ui/Feedback.module.css";
import notificationStyles from "../../shared/ui/NotificationBadge.module.css";
import badgeStyles from "../../shared/ui/WhatsAppBadge.module.css";

interface MissionLocaleFeedbackProps {
  situation?: IUpdateMissionLocaleEffectif | null;
  visibility: "ORGANISME_FORMATION" | "MISSION_LOCALE" | "ADMINISTRATEUR";
  logs?: Array<IMissionLocaleEffectifLog & { unread_by_current_user?: boolean | null }> | null;
  isNouveauContrat?: boolean;
  whatsappContact?: IWhatsAppContact | null;
  prenom?: string;
}

function WhatsAppFeedbackBlock({ whatsappContact, prenom }: { whatsappContact: IWhatsAppContact; prenom: string }) {
  const userResponse = whatsappContact.user_response;

  return (
    <div className={styles.feedbackContainer}>
      <p>
        <b>
          Le Tableau de bord de l&apos;apprentissage a envoyé un message Whatsapp à {prenom} pour lui demander si
          il/elle souhaitait être recontacté.
        </b>
      </p>

      {userResponse === "callback" && (
        <>
          <Tag>Souhaite être recontacté par la Mission locale ✅</Tag>
          <p className={`fr-badge ${badgeStyles.whatsappBadgeCallback}`}>
            <i className="ri-whatsapp-line fr-icon--sm" aria-hidden="true" />
            DISPONIBLE
          </p>
        </>
      )}

      {userResponse === "no_help" && (
        <>
          <Tag>Ne souhaite pas être recontacté par la Mission locale ❌</Tag>
          <p className={`fr-badge ${badgeStyles.whatsappBadgeNoHelp}`}>
            <i className="ri-whatsapp-line fr-icon--sm" aria-hidden="true" />
            NE SOUHAITE PAS ÊTRE RECONTACTÉ·E
          </p>
          <p>
            <b>Le dossier a été classé comme traité automatiquement</b>
          </p>
        </>
      )}

      {whatsappContact.opted_out && (
        <p className={`fr-badge ${badgeStyles.whatsappBadgeNoHelp}`}>
          <i className="fr-icon-smartphone-fill fr-icon--sm" aria-hidden="true" />
          DÉSINSCRIT (STOP)
        </p>
      )}

      {!userResponse && !whatsappContact.opted_out && (
        <p style={{ color: "var(--text-mention-grey)", fontStyle: "italic" }}>Pas encore de réponse</p>
      )}
    </div>
  );
}

export function MissionLocaleFeedback({
  visibility,
  logs,
  situation,
  isNouveauContrat,
  whatsappContact,
  prenom,
}: MissionLocaleFeedbackProps) {
  let sortedLogs = logs?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  // pour gerer les effectifs legacy sans logs
  if (!sortedLogs.length && situation?.situation) {
    const virtualLog = {
      _id: { toString: () => "virtual-log" } as any,
      created_at: new Date(),
      mission_locale_effectif_id: "virtual" as any,
      read_by: [],
      situation: situation.situation,
      situation_autre: situation.situation_autre,
      commentaires: situation.commentaires,
      deja_connu: situation.deja_connu,
      unread_by_current_user: false,
    };
    sortedLogs = [virtualLog];
  }

  const organismeFormationLayout = () => {
    return (
      <>
        {sortedLogs.map((log, index) => {
          if (!log.situation || !SITUATION_LABEL_ENUM[log.situation]) {
            return null;
          }

          return (
            <div key={log._id.toString()}>
              {log.created_at && (
                <h3
                  className="fr-mb-2v"
                  style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <span>
                    Retour / Action de la Mission Locale le {formatDate(log.created_at)}
                    {formatContactTimeText(calculateDaysSince(log.created_at))}
                  </span>
                  {log.unread_by_current_user && (
                    <span
                      className={notificationStyles.notificationDot}
                      title="Nouvelle information de la Mission Locale"
                    />
                  )}
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

                if (log.situation === SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE) {
                  return (
                    <div className={styles.feedbackContainer}>
                      <p className="fr-mb-0">
                        <b>Ce jeune ne souhaite pas être recontacté (réponse via WhatsApp).</b>
                      </p>
                      <p className="fr-mb-0">
                        <b>Le dossier a été classé comme traité automatiquement.</b>
                      </p>
                    </div>
                  );
                }

                const isSecondAttempt = index === 1 && log.probleme_type;

                if (isSecondAttempt) {
                  return (
                    <div className={styles.feedbackContainer}>
                      <p className="fr-mb-1v fr-mt-3v">
                        <b>La Mission Locale a-t-elle pu entrer en contact avec ce jeune ?</b>
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
                    <Tag>{SITUATION_LABEL_ENUM[log.situation]}</Tag>

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
            </div>
          );
        })}
      </>
    );
  };

  const missionLocaleLayout = () => {
    type TimelineEntry =
      | { type: "log"; date: Date; log: (typeof sortedLogs)[number]; index: number }
      | { type: "whatsapp"; date: Date };

    const entries: TimelineEntry[] = sortedLogs.map((log, index) => ({
      type: "log" as const,
      date: new Date(log.created_at),
      log,
      index,
    }));

    if (whatsappContact?.last_message_sent_at) {
      entries.push({
        type: "whatsapp",
        date: new Date(whatsappContact.last_message_sent_at),
      });
    }

    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
      <>
        {entries.map((entry, entryIndex) => {
          if (entry.type === "whatsapp") {
            const whatsappDate = new Date(whatsappContact!.last_message_sent_at!);
            return (
              <div key="whatsapp-event">
                <h6 className="fr-mb-2v">
                  Le {formatDateWithTime(whatsappDate)}
                  {formatContactTimeText(calculateDaysSince(whatsappDate))}
                </h6>
                <WhatsAppFeedbackBlock whatsappContact={whatsappContact!} prenom={prenom || "ce jeune"} />
              </div>
            );
          }

          const { log, index } = entry;

          if (!log.situation || !SITUATION_LABEL_ENUM[log.situation]) {
            return null;
          }

          if (log.situation === SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE) {
            return null;
          }

          return (
            <div key={log._id?.toString() || entryIndex}>
              <h6 className="fr-mb-2v">
                {log._id?.toString() === "virtual-log"
                  ? "Situation actuelle"
                  : `Le ${formatDate(log.created_at)}${formatContactTimeText(calculateDaysSince(log.created_at))}`}
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

                const isSecondAttempt = index === 1 && log.probleme_type;

                if (isSecondAttempt || isNouveauContrat) {
                  return (
                    <div className={styles.feedbackContainer}>
                      <p className="fr-mb-1v">
                        <b>Êtes-vous entré en contact avec ce jeune ?</b>
                      </p>
                      <Tag>{log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR ? "Non" : "Oui"}</Tag>
                      {isNouveauContrat ? (
                        <p className="fr-mb-0">
                          <b>Ce jeune a retrouvé un contrat d&apos;apprentissage.</b>
                        </p>
                      ) : null}
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
                      <Tag>{SITUATION_LABEL_ENUM[log.situation]}</Tag>
                      {log.situation === SITUATION_ENUM.AUTRE && (
                        <p className={styles.feedbackText}>({log.situation_autre})</p>
                      )}
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
          );
        })}
      </>
    );
  };

  const hasWhatsApp = whatsappContact?.last_message_sent_at;

  if (!sortedLogs.length && !situation?.situation && !hasWhatsApp) {
    return null;
  }

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
