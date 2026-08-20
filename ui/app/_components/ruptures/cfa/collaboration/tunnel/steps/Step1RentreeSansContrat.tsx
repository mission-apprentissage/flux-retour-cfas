"use client";

import { ErrorMessage, useField } from "formik";

import styles from "../Tunnel.module.css";

interface Step1RentreeSansContratProps {
  prenom: string;
}

export function Step1RentreeSansContrat({ prenom }: Step1RentreeSansContratProps) {
  const [dateField, dateMeta] = useField("date_debut_formation");
  const [rechercheField, rechercheMeta] = useField("recherche_entreprise");

  return (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <p className={styles.question}>Quelle est la date de début de formation</p>
        <label className="fr-label" htmlFor="date_debut_formation">
          Date de début de formation au CFA
        </label>
        <input
          {...dateField}
          id="date_debut_formation"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          className={`fr-input ${dateMeta.touched && dateMeta.error ? "fr-input--error" : ""}`}
        />
        <ErrorMessage name="date_debut_formation" component="p" className="fr-error-text" />
      </div>

      <div className={styles.fieldGroup}>
        <p className={styles.question}>Comment se passe la recherche d&apos;entreprise de {prenom} ?</p>
        <p className={styles.questionHint}>
          Le jeune a-t-il déjà réalisé beaucoup de candidatures ? Depuis combien de temps le jeune candidate ? Quelles
          sont les méthodes qui ont été mises en place ?
        </p>
        <textarea
          {...rechercheField}
          className={`fr-input ${rechercheMeta.touched && rechercheMeta.error ? "fr-input--error" : ""}`}
          placeholder="Décrivez en quelques mots les méthodes déjà adoptées par le jeune"
          rows={5}
        />
        <ErrorMessage name="recherche_entreprise" component="p" className="fr-error-text" />
      </div>
    </div>
  );
}
