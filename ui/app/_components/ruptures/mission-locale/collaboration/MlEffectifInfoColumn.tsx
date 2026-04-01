"use client";

import { useState } from "react";
import { IEffectifMissionLocale } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import {
  EffectifPriorityBadgeMultiple,
  EffectifStatusBadge,
} from "@/app/_components/ruptures/shared/ui/EffectifStatusBadge";
import { formatAnnee, formatDate, formatRelativeDate, getAge } from "@/app/_utils/date.utils";
import { formatPhoneNumber } from "@/app/_utils/phone.utils";
import { getInitials } from "@/app/_utils/user.utils";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./MlCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

interface MlEffectifInfoColumnProps {
  effectif: IEffectifMissionLocale["effectif"];
}

export function MlEffectifInfoColumn({ effectif }: MlEffectifInfoColumnProps) {
  const [contactsOpen, setContactsOpen] = useState(false);

  const age = getAge(effectif.date_de_naissance);
  const isMineur = typeof age === "number" && age < 18;
  const organismeName = effectif.organisme?.nom || effectif.organisme?.raison_sociale || "Organisme non renseigné";

  return (
    <div className={styles.infoColumn}>
      <div className={styles.nameRow}>
        <div className={styles.avatar}>{getInitials(effectif.nom, effectif.prenom)}</div>
        <h4 className="fr-h4">
          {effectif.prenom} {effectif.nom}
        </h4>
      </div>

      <hr className={styles.separator} />

      <div className={styles.badgesGroup}>
        {effectif.nouveau_contrat && (effectif.a_traiter || effectif.injoignable) && (
          <EffectifStatusBadge effectif={effectif} />
        )}
        <EffectifPriorityBadgeMultiple effectif={effectif} organisation="MISSION_LOCALE" />
      </div>

      <hr className={styles.separator} />

      <p className={styles.sectionTitle}>Infos et coordonnées</p>

      <p className={styles.infoLine}>
        Né(e) le {formatDate(effectif.date_de_naissance)} <strong>{age} ans</strong>
      </p>

      {isMineur && (
        <div className={styles.mineurNotice} role="note">
          <i className="fr-icon-lightbulb-fill fr-icon--sm" aria-hidden="true" />
          <span>
            <strong>Jeune mineur</strong> : Les Missions Locales ont des aides et dispositifs spécifiques.
          </span>
        </div>
      )}

      <p className={styles.infoLine}>
        <i className="fr-icon-phone-line fr-icon--sm" aria-hidden="true" />
        {formatPhoneNumber(effectif.telephone_corrected || effectif.telephone) || "Non renseigné"}
      </p>

      <p className={styles.infoLine}>
        <i className="fr-icon-mail-line fr-icon--sm" aria-hidden="true" />
        {effectif.courriel || "Non renseigné"}
      </p>

      <p className={styles.infoLine}>
        <i className="fr-icon-home-4-line fr-icon--sm" aria-hidden="true" />
        Réside à {effectif.adresse?.commune || <span className={styles.noData}>commune non renseignée</span>}{" "}
        {effectif.adresse?.code_postal && `(${effectif.adresse.code_postal})`}
      </p>

      <p className={styles.rqthLine}>RQTH {effectif.rqth ? "Oui" : "Non"}</p>

      <hr className={styles.separator} />

      <p className={styles.sectionTitle}>Formation et établissement</p>

      <p className={styles.infoLine}>
        <i className="ri-school-line fr-icon--sm" aria-hidden="true" />
        {organismeName} {effectif.organisme?.adresse?.departement && `(${effectif.organisme.adresse.departement})`}
      </p>

      <p className={styles.infoLine}>
        <i className="ri-honour-line fr-icon--sm" aria-hidden="true" />
        {effectif.formation?.libelle_long || "Formation non renseignée"}
      </p>

      {(effectif.formation?.niveau_libelle || effectif.formation?.annee) && (
        <p className={styles.formationLevel}>
          {effectif.formation?.niveau_libelle}
          {effectif.formation?.niveau_libelle && effectif.formation?.annee && " "}
          {effectif.formation?.annee && formatAnnee(effectif.formation.annee)}
        </p>
      )}

      {effectif.contact_cfa ? (
        <>
          <DsfrLink
            href="#"
            arrow="none"
            onClick={(e) => {
              e.preventDefault();
              setContactsOpen((open) => !open);
            }}
            className={`fr-link--icon-right ${contactsOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"} ${styles.mlCoordLink}`}
          >
            Coordonnées de l&apos;établissement
          </DsfrLink>

          {contactsOpen && (
            <div className={styles.mlContactDetails}>
              {effectif.contact_cfa.email && <p>{effectif.contact_cfa.email}</p>}
              {effectif.contact_cfa.telephone && <p>{effectif.contact_cfa.telephone}</p>}
            </div>
          )}
        </>
      ) : (
        effectif.organisme?.contacts_from_referentiel &&
        effectif.organisme.contacts_from_referentiel.length > 0 && (
          <>
            <DsfrLink
              href="#"
              arrow="none"
              onClick={(e) => {
                e.preventDefault();
                setContactsOpen((open) => !open);
              }}
              className={`fr-link--icon-right ${contactsOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"} ${styles.mlCoordLink}`}
            >
              Coordonnées de l&apos;établissement
            </DsfrLink>

            {contactsOpen && (
              <div className={styles.mlContactDetails}>
                {effectif.organisme.contacts_from_referentiel.map((contact, i) => (
                  <p key={i}>{contact.email}</p>
                ))}
              </div>
            )}
          </>
        )
      )}

      <hr className={styles.separator} />

      <p className={styles.sourceFooter}>
        {effectif.source === "DECA" ? "Informations captées depuis DECA" : "Informations renseignées par le CFA"} mises
        à jour dans le Tableau de bord le {effectif.transmitted_at ? formatDate(effectif.transmitted_at) : "—"},{" "}
        {effectif.transmitted_at ? formatRelativeDate(effectif.transmitted_at) : ""}
      </p>
    </div>
  );
}
