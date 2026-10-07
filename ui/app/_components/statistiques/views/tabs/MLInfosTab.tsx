import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";

import type { IMissionLocaleDetailResponse } from "../../hooks/useStatsQueries";
import { CopyButton } from "../../ui/CopyButton";
import { formatDateCourte } from "../../utils";
import { MlAdminRdvUrlEditor } from "../MlAdminRdvUrlEditor";

import styles from "./MLInfosTab.module.css";

const NON_RENSEIGNE = "-";

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.info}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const avecCopie = (value: string | undefined, title: string, content?: ReactNode) =>
  value ? (
    <span className={styles.valeur}>
      {content ?? value}
      <CopyButton value={value} title={title} />
    </span>
  ) : (
    NON_RENSEIGNE
  );

const formatAdresse = (adresse: IMissionLocaleDetailResponse["ml"]["adresse"]) => {
  if (!adresse) return null;
  const voie = [adresse.numero, adresse.repetition_voie, adresse.voie].filter(Boolean).join(" ");
  const ville = [adresse.code_postal, adresse.commune].filter(Boolean).join(" ");
  return [voie, adresse.complement, ville].filter(Boolean).join(", ") || null;
};

export function MLInfosTab({
  mlId,
  data,
  isAdmin,
}: {
  mlId: string;
  data: IMissionLocaleDetailResponse;
  isAdmin: boolean;
}) {
  const { ml, indicateurs, last_activity_at } = data;

  return (
    <div>
      <h2 className={styles.titre}>Infos et coordonnées</h2>
      <dl className={styles.grille}>
        <div className={styles.ligne}>
          <Info label="Premier compte créé">{formatDateCourte(indicateurs.premier_compte_at) ?? NON_RENSEIGNE}</Info>
          <Info label="Dernière activité">{formatDateCourte(last_activity_at) ?? NON_RENSEIGNE}</Info>
        </div>
        <Info label="SIRET">{avecCopie(ml.siret, "Copier le SIRET")}</Info>
        <Info label="Adresse">{formatAdresse(ml.adresse) ?? NON_RENSEIGNE}</Info>
        <Info label="Adresse courriel générique">
          {avecCopie(
            ml.email,
            "Copier l'adresse courriel",
            <a href={`mailto:${ml.email}`} className={fr.cx("fr-link")}>
              {ml.email}
            </a>
          )}
        </Info>
        <Info label="N° de téléphone générique">{avecCopie(ml.telephone, "Copier le numéro de téléphone")}</Info>
        <Info label="Site internet">
          {ml.site_web ? (
            <a href={ml.site_web} target="_blank" rel="noopener noreferrer" className={fr.cx("fr-link")}>
              {ml.site_web}
            </a>
          ) : (
            NON_RENSEIGNE
          )}
        </Info>
        <div className={styles.rdv}>
          <Info label="Lien de prise de rendez-vous à la Mission Locale">
            {isAdmin ? (
              <MlAdminRdvUrlEditor mlId={mlId} rdvUrl={ml.rdv_url} />
            ) : ml.rdv_url ? (
              <a href={ml.rdv_url} target="_blank" rel="noopener noreferrer" className={fr.cx("fr-link")}>
                {ml.rdv_url}
              </a>
            ) : (
              "Non renseigné"
            )}
          </Info>
          <p className={styles.aide}>
            <span className="fr-icon-info-line fr-icon--xs" aria-hidden="true" />
            Ce lien sera envoyé aux jeunes qui répondent positivement aux messages que nous envoyons pour qu&apos;ils
            puissent prendre RDV directement avec la Mission Locale.
          </p>
        </div>
      </dl>
    </div>
  );
}
