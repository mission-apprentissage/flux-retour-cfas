"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import React, { useState } from "react";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale, IMissionLocaleEffectifList } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { formatDate, getMonthYearFromDate } from "@/app/_utils/date.utils";

import { CfaFeedback } from "./CfaFeedback";
import { ConfirmReset } from "./ConfirmReset";
import styles from "./EffectifInfo.module.css";
import { EffectifInfoDetails } from "./EffectifInfoDetails";
import { MLFeedback } from "./MLFeedback";

const StatusChangeInformation = ({ date }: { date?: Date | null }) => {
  const now = new Date();
  const defaultText = "Il a été indiqué que ce jeune a retrouvé un nouveau contrat";
  if (!date) return defaultText;

  const text =
    new Date(date) < now
      ? `${defaultText}, qui a débuté le ${formatDate(date)}`
      : `${defaultText}, qui va débuter le ${formatDate(date)}`;
  return (
    <div className={styles.statusChangeInfo}>
      <p className={`fr-text--sm ${styles.statusChangeText}`}>{text}</p>
    </div>
  );
};

export function EffectifInfo({
  effectif,
  nomListe,
  isAdmin = false,
  setIsEditable,
}: {
  effectif: IEffecifMissionLocale["effectif"];
  nomListe: IMissionLocaleEffectifList;
  isAdmin?: boolean;
  setIsEditable?: (isEditable: boolean) => void;
}) {
  const { user } = useAuth();
  const [infosOpen, setInfosOpen] = useState(false);
  const isListePrioritaire = nomListe === API_EFFECTIF_LISTE.PRIORITAIRE;

  const computeTransmissionDate = (date) => {
    return date ? `le ${formatDate(date)}` : "il y a plus de deux semaines";
  };

  return (
    <div className={styles.effectifInfoResponsive}>
      <div
        style={{
          background: isListePrioritaire ? "var(--background-alt-blue-france)" : "white",
        }}
        className={styles.effectifInfoContainer}
      >
        <div className={styles.effectifInfoInner}>
          <div className={styles.effectifHeader}>
            <div className={styles.flexCenterGap8}>
              {effectif.injoignable ? (
                <Badge severity="info">Contacté sans réponse</Badge>
              ) : effectif.a_traiter && (effectif.prioritaire || effectif.a_contacter) ? (
                <p className={`fr-badge fr-badge--orange-terre-battue ${styles.badgeGap}`}>
                  <i className="fr-icon-fire-fill fr-icon--sm" /> À TRAITER EN PRIORITÉ
                </p>
              ) : effectif.a_traiter ? (
                <Badge severity="new">à traiter</Badge>
              ) : (
                <Badge severity="success">traité</Badge>
              )}
              <p className="fr-badge fr-badge--beige-gris-galet">{getMonthYearFromDate(effectif.date_rupture)}</p>
            </div>

            {isAdmin && !effectif.a_traiter && (
              <div className={styles.adminActions}>
                <ConfirmReset />

                {!effectif.injoignable && (
                  <Button size="small" priority="secondary" onClick={() => setIsEditable?.(true)}>
                    Modifier
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className={styles.effectifContent}>
            <h3 className={`fr-text--blue-france ${styles.effectifTitle}`}>
              {effectif.nom} {effectif.prenom}
            </h3>
            <Notice
              className={styles.noticeContainer}
              style={{
                backgroundColor: isListePrioritaire ? "var(--background-alt-blue-france)" : "white",
              }}
              title="Date de la rupture du contrat d'apprentissage :"
              description={
                formatDate(effectif.date_rupture) ? `le ${formatDate(effectif.date_rupture)}` : "non renseignée"
              }
            />
            <p className={styles.transmissionInfo}>
              {effectif.source === "DECA" ? (
                <span>Données transmises par l&apos;API DECA {computeTransmissionDate(effectif.transmitted_at)}</span>
              ) : (
                <span>Données transmises par le CFA {computeTransmissionDate(effectif.transmitted_at)}</span>
              )}
            </p>
          </div>
          {typeof effectif?.autorisation_contact === "boolean" && (
            <Highlight className={styles.highlightMargin} size="sm">
              {effectif.nom} {effectif.prenom}
              {effectif.autorisation_contact
                ? " a indiqué avoir besoin d'être accompagné par vos services "
                : " a indiqué ne pas avoir besoin d'être accompagné par vos services "}
              (campagne emailing).
            </Highlight>
          )}
          {effectif?.current_status?.value === "APPRENTI" && (
            <StatusChangeInformation date={effectif?.current_status?.date} />
          )}
        </div>
      </div>
      <EffectifInfoDetails effectif={effectif} infosOpen={infosOpen} setInfosOpen={setInfosOpen} />

      {"organisme_data" in effectif && effectif.organisme_data ? (
        <CfaFeedback
          organismeData={effectif.organisme_data}
          transmittedAt={effectif.transmitted_at}
          visibility={user.organisation.type}
        />
      ) : null}

      {!effectif.a_traiter && !effectif.injoignable && effectif.situation && (
        <MLFeedback
          situation={effectif.situation}
          visibility={user.organisation.type}
          logs={effectif.mission_locale_logs}
        />
      )}
    </div>
  );
}
