"use client";

import { usePathname } from "next/navigation";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, getAge } from "@/app/_utils/date.utils";

import styles from "./EffectifInfoDetails.module.css";
import { MissionLocaleContact } from "./MissionLocaleContact";

export function EffectifInfoDetails({ effectif, infosOpen, setInfosOpen }) {
  const pathname = usePathname();
  const isCfaPage = pathname?.startsWith("/cfa/");

  const withDefaultFallback = (data, defaultText, value?) => {
    const defaultValue = value ?? "";
    return data ? defaultValue : <span className={styles.noDataSpan}>{defaultText}</span>;
  };

  return (
    <div className={`fr-grid-row ${styles.effectifInfoDetailsContainer}`}>
      <div className="fr-col-12 fr-col-md-8">
        <div>
          <p>
            Née le {formatDate(effectif.date_de_naissance)} ({getAge(effectif.date_de_naissance) || "?"} ans)
          </p>
          <p>
            Réside à{" "}
            {withDefaultFallback(effectif.adresse?.commune, "commune non renseignée", effectif.adresse?.commune)}{" "}
            {withDefaultFallback(effectif.adresse?.code_postal, null, `(${effectif.adresse?.code_postal})`)}
          </p>
          <p>
            {withDefaultFallback(
              effectif.formation?.libelle_long,
              "Intitulé de la formation non renseigné",
              effectif.formation?.libelle_long
            )}
          </p>
          <p>
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
          <p>RQTH : {effectif.rqth ? "oui" : "non"}</p>
          {isCfaPage && <MissionLocaleContact missionLocaleOrganisation={effectif.mission_locale_organisation} />}
          {!isCfaPage && (
            <DsfrLink
              href="#"
              arrow="none"
              onClick={(e) => {
                e.preventDefault();
                setInfosOpen((open) => !open);
              }}
              className={`fr-link--icon-right ${infosOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
            >
              Informations complémentaires
            </DsfrLink>
          )}
        </div>

        {infosOpen && !isCfaPage && (
          <div className={styles.detailsSection}>
            <div>
              <p>Contrat d&apos;apprentissage</p>
              {effectif.contrats?.map((c, idx) => (
                <div key={idx} className={styles.contractItem}>
                  <p>Date de début : {formatDate(c.date_debut) || "non renseignée"}</p>
                  <p>Date de fin : {formatDate(c.date_fin) || "non renseignée"}</p>
                  <p>Cause de rupture : {c.cause_rupture || "non renseignée"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={"fr-col-12 fr-col-md-4 " + styles.detailsSection}>
        <div className={styles.contractItem}>
          <p>
            <b>Coordonnées</b>
          </p>
          <p>{effectif.telephone_corrected || effectif.telephone || ""}</p>
          <p>{effectif.courriel || ""}</p>
        </div>
        {effectif.formation?.referent_handicap && (
          <div className={styles.detailsSection}>
            <div className={styles.contractItem}>
              <p>
                <b>Responsable légal</b>
              </p>
              <p>
                {effectif.formation?.referent_handicap?.prenom} {effectif.formation?.referent_handicap?.nom}
              </p>
              <p>{effectif.formation?.referent_handicap?.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
