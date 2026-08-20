"use client";

import { useField, useFormikContext } from "formik";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { dePrenom } from "@/app/_utils/ruptures.utils";

import { FormValues } from "../../types";
import styles from "../Tunnel.module.css";

interface StepRecapProps {
  prenom: string;
  nom: string;
  mlName?: string;
}

export function StepRecap({ prenom, nom, mlName }: StepRecapProps) {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const [noteField] = useField("note_complementaire");
  const [remarqueField] = useField("feedback_remarque");
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  return (
    <div className={styles.fields}>
      <p className={styles.recapOverline}>Dossier prêt !</p>
      <h1 className={styles.recapTitle}>
        Toutes les informations sont prêtes pour envoyer le dossier{" "}
        <span className={styles.recapHighlight}>{dePrenom(`${prenom} ${nom}`)}</span> à la{" "}
        <span className={styles.recapHighlight}>{mlName ? `Mission Locale ${mlName}` : "Mission Locale"}</span>
      </h1>

      <div className={styles.fieldGroup}>
        <label className="fr-label" htmlFor="note_complementaire">
          Écrivez un petit message à la Mission Locale pour le dossier {dePrenom(prenom)}
          <span className="fr-hint-text">Facultatif</span>
        </label>
        <textarea
          {...noteField}
          id="note_complementaire"
          onBlur={(e) => {
            noteField.onBlur(e);
            if (e.target.value.trim()) trackPlausibleEvent("cfa_form_note_saisie");
          }}
          className="fr-input"
          placeholder="Votre message ici"
          rows={4}
        />
      </div>

      <div className={styles.feedbackCard}>
        <p className={styles.question}>
          Comment avez-vous trouvé le formulaire de demande de collaboration ?{" "}
          <span className="fr-hint-text">Facultatif</span>
        </p>
        <div className={styles.feedbackScale}>
          {[0, 1, 2, 3, 4, 5].map((note) => (
            <button
              key={note}
              type="button"
              className={`${styles.feedbackButton} ${values.feedback_note === note ? styles.feedbackButtonSelected : ""}`}
              aria-pressed={values.feedback_note === note}
              onClick={() => setFieldValue("feedback_note", note)}
            >
              {note}
            </button>
          ))}
        </div>
        <div className={styles.feedbackLegend}>
          <span>Très difficile</span>
          <span>Très facile</span>
        </div>

        {values.feedback_note !== null && (
          <div className={styles.fieldGroup}>
            <label className="fr-label" htmlFor="feedback_remarque">
              Une remarque pour améliorer notre formulaire de collaboration ?
              <span className="fr-hint-text">Facultatif</span>
            </label>
            <textarea
              {...remarqueField}
              id="feedback_remarque"
              className="fr-input"
              placeholder="Votre message ici"
              rows={3}
            />
          </div>
        )}
      </div>
    </div>
  );
}
