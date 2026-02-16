"use client";

import { usePathname } from "next/navigation";
import { IEffectifMissionLocale } from "shared/models/routes/mission-locale/MissionLocaleEffectif";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, getAge } from "@/app/_utils/date.utils";
import { formatPhoneNumber } from "@/app/_utils/phone.utils";

import styles from "./EffectifInfoDetails.module.css";
import { MissionLocaleContact } from "./MissionLocaleContact";

interface EffectifInfoDetailsProps {
  effectif: IEffectifMissionLocale["effectif"];
  infosOpen: boolean;
  setInfosOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function EffectifInfoDetails({ effectif, infosOpen, setInfosOpen }: EffectifInfoDetailsProps) {
  const pathname = usePathname();
  const isCfaPage = pathname?.startsWith("/cfa/");

  const withDefaultFallback = (data, defaultText, value?) => {
    const defaultValue = value ?? "";
    return data ? defaultValue : <span className={styles.noDataSpan}>{defaultText}</span>;
  };

  return (
    <>
      <div className={styles.effectifInfoDetailsContainer}>
        <div>
          <div className={styles.headerRow}>
            <p>
              Née le {formatDate(effectif.date_de_naissance)} ({getAge(effectif.date_de_naissance) || "?"} ans)
            </p>
            <p className={styles.rqthBadge}>RQTH : {effectif.rqth ? "oui" : "non"}</p>
          </div>
          <p>
            <i className={`fr-icon-home-4-line ${styles.iconSmall}`} />
            Réside à{" "}
            <strong>
              {withDefaultFallback(effectif.adresse?.commune, "commune non renseignée", effectif.adresse?.commune)}
            </strong>{" "}
            {withDefaultFallback(effectif.adresse?.code_postal, null, `(${effectif.adresse?.code_postal})`)}
          </p>
        </div>

        <div className={`fr-grid-row ${styles.coordonneesGrid}`}>
          <div className="fr-col-12 fr-col-md-6">
            <p className={styles.sectionTitle}>Coordonnées</p>
            <p>{formatPhoneNumber(effectif.telephone_corrected || effectif.telephone) || "-"}</p>
            <p>{effectif.courriel || ""}</p>
          </div>

          {(effectif.responsable_mail1 || effectif.responsable_mail2) && (
            <div className="fr-col-12 fr-col-md-6">
              <p className={styles.sectionTitle}>Responsable légal</p>
              {effectif.responsable_mail1 && <p>{effectif.responsable_mail1}</p>}
              {effectif.responsable_mail2 && <p>{effectif.responsable_mail2}</p>}
            </div>
          )}

          {(effectif.formation?.referent_handicap?.nom ||
            effectif.formation?.referent_handicap?.prenom ||
            effectif.formation?.referent_handicap?.email) && (
            <div className="fr-col-12 fr-col-md-6">
              <p className={styles.sectionTitle}>Référent handicap</p>
              {(effectif.formation?.referent_handicap?.prenom || effectif.formation?.referent_handicap?.nom) && (
                <p>
                  {effectif.formation?.referent_handicap?.prenom} {effectif.formation?.referent_handicap?.nom}
                </p>
              )}
              {effectif.formation?.referent_handicap?.email && <p>{effectif.formation?.referent_handicap?.email}</p>}
            </div>
          )}
        </div>
      </div>

      <div className={styles.effectifInfoDetailsContainer}>
        <div className={styles.formationSection}>
          <p className={styles.sectionTitle}>Formation</p>
          <p>
            <i className={`ri-school-line ${styles.icon}`} />
            {withDefaultFallback(
              effectif.organisme?.nom,
              "Organisme de formation non renseigné",
              effectif.organisme?.nom
            )}{" "}
            {withDefaultFallback(
              effectif.organisme?.adresse?.departement,
              null,
              `(${effectif.organisme?.adresse?.departement})`
            )}
          </p>
          <p>
            <i className={`ri-honour-line ${styles.icon}`} />
            {withDefaultFallback(
              effectif.formation?.libelle_long,
              "Intitulé de la formation non renseigné",
              effectif.formation?.libelle_long
            )}
          </p>
        </div>

        {!isCfaPage && effectif.contact_cfa && (
          <div className={styles.contactCfaSection}>
            <p className={styles.sectionTitle}>Coordonnées de l&apos;accompagnant du jeune dans ce CFA</p>
            <p>
              {effectif.contact_cfa.telephone && `${formatPhoneNumber(effectif.contact_cfa.telephone) || "-"}  `}
              {effectif.contact_cfa.email}
            </p>
          </div>
        )}

        {isCfaPage && effectif.mission_locale_organisation && (
          <MissionLocaleContact
            missionLocaleOrganisation={{
              _id: effectif.mission_locale_organisation._id.toString(),
              nom: effectif.mission_locale_organisation.nom,
              email: effectif.mission_locale_organisation.email ?? undefined,
              telephone: effectif.mission_locale_organisation.telephone ?? undefined,
              activated_at: effectif.mission_locale_organisation.activated_at ?? undefined,
            }}
          />
        )}

        {!isCfaPage && (
          <div className={styles.additionalInfoToggle}>
            <DsfrLink
              href="#"
              arrow="none"
              onClick={(e) => {
                e.preventDefault();
                setInfosOpen((open) => !open);
              }}
              className={`fr-link--icon-right ${infosOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
            >
              Informations du contrat d&apos;apprentissage
            </DsfrLink>
          </div>
        )}

        {infosOpen && !isCfaPage && (
          <div className={styles.contractDetails}>
            <p className={styles.contractLabel}>Contrat d&apos;apprentissage</p>
            {effectif.contrats?.map((c, idx) => (
              <div key={idx} className={styles.contractItem}>
                <p>Date de début : {formatDate(c.date_debut) || "non renseignée"}</p>
                <p>Date de fin : {formatDate(c.date_fin) || "non renseignée"}</p>
                <p>Cause de rupture : {c.cause_rupture || "non renseignée"}</p>
              </div>
            ))}

            {effectif.organisme?.contacts_from_referentiel &&
              effectif.organisme.contacts_from_referentiel.length > 0 && (
                <div className={styles.contractItem}>
                  <p className={styles.contractLabel}>Email de l&apos;organisme de formation</p>
                  {effectif.organisme.contacts_from_referentiel.map((contact, idx) => (
                    <p key={idx}>{contact.email}</p>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </>
  );
}
