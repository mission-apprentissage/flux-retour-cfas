"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import React, { useState } from "react";
import { IEffecifMissionLocale } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { formatDate, getMonthYearFromDate } from "@/app/_utils/date.utils";

import { CfaFeedback } from "../../cfa";
import { ContactForm, MissionLocaleFeedback } from "../../mission-locale";
import { shouldShowContactForm } from "../utils";

import { ConfirmReset } from "./ConfirmReset";
import styles from "./EffectifInfo.module.css";
import { EffectifInfoDetails } from "./EffectifInfoDetails";
import { EffectifDetailStatusBadge, EffectifPriorityBadgeList } from "./EffectifStatusBadge";
import { ProblematiquesJeune } from "./ProblematiquesJeune";

const StatusChangeInformation = ({ date }: { date?: Date | null }) => {
  const now = new Date();
  let text: string;
  if (!date) {
    text = "Ce jeune est à nouveau en contrat (date inconnue)";
  } else {
    text =
      new Date(date) < now
        ? `Ce jeune est à nouveau en contrat depuis le ${formatDate(date)}`
        : `Ce jeune sera à nouveau en contrat le ${formatDate(date)}`;
  }

  return (
    <div className={styles.statusChangeInfo}>
      <p className={`fr-text--sm ${styles.statusChangeText}`}>
        <Image
          src="/images/info-nouveau-contrat.svg"
          alt="Information nouveau contrat"
          width={16}
          height={16}
          style={{ marginRight: "8px", verticalAlign: "middle" }}
        />
        {text}
      </p>
    </div>
  );
};

export function EffectifInfo({
  effectif,
  isAdmin = false,
  setIsEditable,
  nextEffectifId,
}: {
  effectif: IEffecifMissionLocale["effectif"];
  isAdmin?: boolean;
  setIsEditable?: (isEditable: boolean) => void;
  nextEffectifId?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [effectifUpdated, setEffectifUpdated] = useState(false);
  const [infosOpen, setInfosOpen] = useState(false);
  const isPrioritaire = effectif.prioritaire && (effectif.a_traiter || effectif.injoignable);

  const computeTransmissionDate = (date: Date | null | undefined) => {
    return date ? `le ${formatDate(date)}` : "il y a plus de deux semaines";
  };

  const handleContactFormSuccess = (shouldContinue?: boolean) => {
    setEffectifUpdated(true);

    if (shouldContinue) {
      if (nextEffectifId && pathname) {
        const pathSegments = pathname.split("/");
        pathSegments[pathSegments.length - 1] = nextEffectifId;
        const newPath = pathSegments.join("/");
        router.push(newPath);
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  const showContactForm = shouldShowContactForm(user.organisation.type, effectif, effectifUpdated);

  return (
    <div className={styles.effectifInfoResponsive}>
      <div
        style={{
          background: isPrioritaire ? "var(--red-marianne-975-75)" : "white",
        }}
        className={styles.effectifInfoContainer}
      >
        <div className={isPrioritaire ? styles.effectifInfoInner : ""}>
          <div className={styles.effectifHeader} style={{}}>
            <div className={styles.flexCenterGap8}>
              <EffectifDetailStatusBadge effectif={effectif} />
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
          <div>
            <EffectifPriorityBadgeList effectif={effectif} />
          </div>
          <div className={styles.effectifContent}>
            {effectif.nouveau_contrat && <StatusChangeInformation date={effectif?.current_status?.date} />}
            <h3 className={`fr-text--blue-france ${styles.effectifTitle}`}>
              {effectif.nom} {effectif.prenom}
            </h3>
            {!effectif.nouveau_contrat && (
              <>
                <Notice
                  className={styles.noticeContainer}
                  style={{
                    backgroundColor: isPrioritaire ? "var(--red-marianne-975-75)" : "white",
                  }}
                  title="Date de la rupture du contrat d'apprentissage :"
                  description={
                    formatDate(effectif.date_rupture) ? `le ${formatDate(effectif.date_rupture)}` : "non renseignée"
                  }
                />
                <p className={styles.transmissionInfo}>
                  {effectif.source === "DECA" ? (
                    <span>
                      Données transmises par l&apos;API DECA {computeTransmissionDate(effectif.transmitted_at)}
                    </span>
                  ) : (
                    <span>Données transmises par le CFA {computeTransmissionDate(effectif.transmitted_at)}</span>
                  )}
                </p>
              </>
            )}
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
        </div>
      </div>
      <EffectifInfoDetails effectif={effectif} infosOpen={infosOpen} setInfosOpen={setInfosOpen} />

      {user.organisation.type === "MISSION_LOCALE" && "organisme_data" in effectif && effectif.organisme_data ? (
        <ProblematiquesJeune organismeData={effectif.organisme_data} effectif={effectif} showContacts={false} />
      ) : null}

      {showContactForm && (
        <ContactForm effectifId={effectif.id.toString()} onSuccess={handleContactFormSuccess} effectif={effectif} />
      )}

      {effectif.situation && (
        <MissionLocaleFeedback
          situation={effectif.situation}
          visibility={user.organisation.type}
          logs={effectif.mission_locale_logs as any}
          isNouveauContrat={effectif.nouveau_contrat ?? undefined}
        />
      )}

      {user.organisation.type !== "MISSION_LOCALE" && "organisme_data" in effectif && effectif.organisme_data ? (
        <CfaFeedback
          organismeData={effectif.organisme_data}
          transmittedAt={effectif.transmitted_at}
          visibility={user.organisation.type}
          effectif={effectif}
        />
      ) : null}
    </div>
  );
}
