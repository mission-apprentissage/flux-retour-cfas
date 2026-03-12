"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useState } from "react";
import { IEffectifMissionLocale } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, formatRelativeDate, getAge } from "@/app/_utils/date.utils";
import { formatPhoneNumber } from "@/app/_utils/phone.utils";

import styles from "./CfaCollaborationDetail.module.css";

interface CfaEffectifInfoColumnProps {
  effectif: IEffectifMissionLocale["effectif"];
}

function getInitials(nom?: string | null, prenom?: string | null): string {
  const n = nom?.charAt(0)?.toUpperCase() || "";
  const p = prenom?.charAt(0)?.toUpperCase() || "";
  return n || p ? `${p}.${n}` : "?";
}

function formatAnnee(annee: number): string {
  return annee === 1 ? "1ère année" : `${annee}ème année`;
}

export function CfaEffectifInfoColumn({ effectif }: CfaEffectifInfoColumnProps) {
  const [contactsOpen, setContactsOpen] = useState(false);

  const age = getAge(effectif.date_de_naissance);
  const isMineur = typeof age === "number" && age < 18;
  const enRupture = !!effectif.date_rupture;

  return (
    <div className={styles.infoColumn}>
      <div className={styles.nameRow}>
        <div className={styles.avatar}>{getInitials(effectif.nom, effectif.prenom)}</div>
        <h4 className="fr-h4">
          {effectif.prenom} {effectif.nom}
        </h4>
      </div>

      <hr className={styles.separator} />

      <div className={styles.ruptureBlock}>
        <p className={styles.ruptureLabel}>
          En rupture de contrat ?
          {enRupture && (
            <span style={{ marginLeft: "0.25rem" }}>
              <Tooltip
                kind="hover"
                title={
                  <>
                    Sur la version actuelle du Tableau de bord vous ne pouvez pas supprimer le statut &quot;En
                    rupture&quot; sur le dossier d&apos;un jeune. Si le problème persiste ou que vous souhaitez nous
                    faire part d&apos;une recommandation{" "}
                    <a href="https://cfas.apprentissage.beta.gouv.fr/contact" target="_blank" rel="noopener noreferrer">
                      Écrivez-nous directement
                    </a>
                    , l&apos;équipe du service reste disponible.
                  </>
                }
              />
            </span>
          )}
        </p>
        <ToggleSwitch
          inputTitle="En rupture de contrat"
          label=""
          labelPosition="left"
          checked={enRupture}
          onChange={() => {}}
          showCheckedHint={false}
        />
      </div>

      <hr className={styles.separator} />

      <p className={styles.sectionTitle}>Infos et coordonnées</p>

      <p className={styles.infoLine}>
        Né(e) le {formatDate(effectif.date_de_naissance)} <strong>{age} ans</strong>
      </p>

      {isMineur && (
        <Alert
          severity="warning"
          small
          description="Jeune mineur : Les Missions Locales ont des aides et dispositifs spécifiques."
          className="fr-mb-2w"
        />
      )}

      <p className={styles.infoLine}>
        <i className="fr-icon-phone-line fr-icon--sm" />
        {formatPhoneNumber(effectif.telephone_corrected || effectif.telephone) || "Non renseigné"}
      </p>

      <p className={styles.infoLine}>
        <i className="fr-icon-mail-line fr-icon--sm" />
        {effectif.courriel || "Non renseigné"}
      </p>

      <p className={styles.infoLine}>
        <i className="fr-icon-home-4-line fr-icon--sm" />
        Réside à {effectif.adresse?.commune || <span className={styles.noData}>commune non renseignée</span>}{" "}
        {effectif.adresse?.code_postal && `(${effectif.adresse.code_postal})`}
      </p>

      <p className={styles.rqthLine}>RQTH {effectif.rqth ? "Oui" : "Non"}</p>

      <hr className={styles.separator} />

      <p className={styles.sectionTitle}>Formation et établissement</p>

      <p className={styles.infoLine}>
        <i className="ri-school-line fr-icon--sm" />
        {effectif.organisme?.nom || "Organisme non renseigné"}{" "}
        {effectif.organisme?.adresse?.departement && `(${effectif.organisme.adresse.departement})`}
      </p>

      <p className={styles.infoLine}>
        <i className="ri-honour-line fr-icon--sm" />
        {effectif.formation?.libelle_long || "Formation non renseignée"}
      </p>

      {(effectif.formation?.niveau_libelle || effectif.formation?.annee) && (
        <p className={styles.formationLevel}>
          {effectif.formation?.niveau_libelle}
          {effectif.formation?.niveau_libelle && effectif.formation?.annee && " "}
          {effectif.formation?.annee && formatAnnee(effectif.formation.annee)}
        </p>
      )}

      <hr className={styles.separator} />

      <p className={styles.sectionTitle}>Mission Locale de rattachement</p>

      {effectif.mission_locale_organisation ? (
        <>
          <p className={styles.mlName}>
            <i className="ri-school-line fr-icon--sm" />
            Mission Locale de {effectif.mission_locale_organisation.nom}
          </p>
          <DsfrLink
            href="#"
            arrow="none"
            onClick={(e) => {
              e.preventDefault();
              setContactsOpen((open) => !open);
            }}
            className={`fr-link--icon-right ${contactsOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"} ${styles.mlCoordLink}`}
          >
            Coordonnées de la Mission Locale
          </DsfrLink>

          {contactsOpen && (
            <div className={styles.mlContactDetails}>
              {effectif.mission_locale_organisation.telephone && (
                <p>{effectif.mission_locale_organisation.telephone}</p>
              )}
              {effectif.mission_locale_organisation.email && <p>{effectif.mission_locale_organisation.email}</p>}
            </div>
          )}
        </>
      ) : (
        <p className={styles.noData}>Aucune Mission Locale rattachée</p>
      )}

      <hr className={styles.separator} />

      <p className={styles.sourceFooter}>
        {effectif.source === "DECA" ? "Informations captées depuis DECA" : "Informations renseignées dans votre ERP"}{" "}
        mises à jour dans le Tableau de bord le {effectif.transmitted_at ? formatDate(effectif.transmitted_at) : "—"},{" "}
        {effectif.transmitted_at ? formatRelativeDate(effectif.transmitted_at) : ""}
      </p>
    </div>
  );
}
