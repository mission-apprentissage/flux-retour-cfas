"use client";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, getAge } from "@/app/_utils/date.utils";

import styles from "./EffectifInfoDetails.module.css";

export function EffectifInfoDetails({ effectif, infosOpen, setInfosOpen }) {
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
          <DsfrLink
            href="#"
            arrow="none"
            onClick={() => setInfosOpen((open) => !open)}
            className={`fr-link--icon-right ${infosOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
          >
            Informations complémentaires
          </DsfrLink>
        </div>

        {infosOpen && (
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
              <p className={styles.detailsTitleWithMargin}>Coordonnées du CFA</p>
              {effectif.organisme?.contacts_from_referentiel?.map((contact, idx) => (
                <div key={idx} className={styles.contractItem}>
                  <p>E-mail : {contact.email || "non renseigné"}</p>
                </div>
              ))}
              {effectif.contacts_tdb?.map(({ email, telephone, nom, prenom, fonction }, idx) => (
                <div key={idx} className={styles.contractItem}>
                  <p>
                    {nom} {prenom} {fonction ? `(${fonction})` : ""}
                  </p>
                  <p>E-mail : {email || "non renseigné"}</p>
                  <p>Téléphone : {telephone || "non renseigné"}</p>
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
