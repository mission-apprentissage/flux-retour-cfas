"use client";

import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useState } from "react";
import { IEffectifMissionLocale } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { formatAnnee, formatDate, formatRelativeDate, getAge } from "@/app/_utils/date.utils";
import { formatPhoneNumber } from "@/app/_utils/phone.utils";
import { getInitials } from "@/app/_utils/user.utils";

import { MlInactiveBadge } from "../../shared/collaboration/MlInactiveBadge";
import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./CfaCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

interface CfaEffectifInfoColumnProps {
  effectif: IEffectifMissionLocale["effectif"];
  onToggleRupture?: () => void;
}

export function CfaEffectifInfoColumn({ effectif, onToggleRupture }: CfaEffectifInfoColumnProps) {
  const [contactsOpen, setContactsOpen] = useState(false);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const age = getAge(effectif.date_de_naissance);
  const isMineur = typeof age === "number" && age < 18;
  const enRupture = !!effectif.date_rupture || !!effectif.cfa_rupture_declaration;

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
          onChange={() => {
            if (enRupture) trackPlausibleEvent("cfa_rupture_contestee");
            onToggleRupture?.();
          }}
          showCheckedHint={false}
        />
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
        {(() => {
          const phone = formatPhoneNumber(effectif.telephone_corrected || effectif.telephone);
          return phone ? (
            <a
              href={`tel:${effectif.telephone_corrected || effectif.telephone}`}
              onClick={() => trackPlausibleEvent("cfa_fiche_contact_tel")}
            >
              {phone}
            </a>
          ) : (
            "Non renseigné"
          );
        })()}
      </p>

      <p className={styles.infoLine}>
        <i className="fr-icon-mail-line fr-icon--sm" aria-hidden="true" />
        {effectif.courriel ? (
          <a href={`mailto:${effectif.courriel}`} onClick={() => trackPlausibleEvent("cfa_fiche_contact_email")}>
            {effectif.courriel}
          </a>
        ) : (
          "Non renseigné"
        )}
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
        {effectif.organisme?.nom || "Organisme non renseigné"}{" "}
        {effectif.organisme?.adresse?.departement && `(${effectif.organisme.adresse.departement})`}
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

      <hr className={styles.separator} />

      <p className={styles.sectionTitle}>Mission Locale de rattachement</p>
      {effectif.mission_locale_organisation && !effectif.mission_locale_organisation.activated_at && (
        <MlInactiveBadge />
      )}

      {effectif.mission_locale_organisation ? (
        <>
          <p className={styles.mlName}>
            <i className="ri-school-line fr-icon--sm" aria-hidden="true" />
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
