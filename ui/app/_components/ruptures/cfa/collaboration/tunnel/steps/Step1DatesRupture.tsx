"use client";

import { ErrorMessage, useField, useFormikContext } from "formik";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import { FormValues } from "../../types";
import styles from "../Tunnel.module.css";

function DateField({ name, label }: { name: string; label: string }) {
  const [field, meta] = useField(name);

  return (
    <div className={styles.fieldGroup}>
      <label className="fr-label" htmlFor={name}>
        {label}
      </label>
      <input
        {...field}
        id={name}
        type="date"
        max={new Date().toISOString().slice(0, 10)}
        className={`fr-input ${meta.touched && meta.error ? "fr-input--error" : ""}`}
      />
      <ErrorMessage name={name} component="p" className="fr-error-text" />
    </div>
  );
}

export function Step1DatesRupture() {
  const { values } = useFormikContext<FormValues>();
  const [causeField, causeMeta] = useField("cause_rupture");
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const aQuitteLeCfa = values.still_at_cfa === false;

  return (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <p className={styles.question}>
          {aQuitteLeCfa ? "Quelle est la date de la rupture de contrat ?" : "Quelle est la date de la rupture ?"}
        </p>
        <DateField name="date_rupture" label="Date de rupture de contrat" />
      </div>

      {aQuitteLeCfa && (
        <div className={styles.fieldGroup}>
          <p className={styles.question}>Quand le jeune a-t-il quitté le CFA ?</p>
          <DateField name="date_abandon" label="Date abandon" />
        </div>
      )}

      <div className={styles.fieldGroup}>
        <p className={styles.question}>
          {aQuitteLeCfa
            ? "Pouvez-vous nous en dire plus sur la cause et les circonstances de la rupture de contrat et de l'abandon ?"
            : "Pouvez-vous nous en dire plus sur la cause et les circonstances de la rupture ?"}
        </p>
        <p className={styles.questionHint}>
          Décrivez ce qu&apos;il s&apos;est passé dans les faits (ex: problème d&apos;organisation d&apos;emploi du
          temps, faute grave professionnelle, l&apos;employeur n&apos;a pas mis à disposition de tuteur…)
        </p>
        <textarea
          {...causeField}
          onBlur={(e) => {
            causeField.onBlur(e);
            if (e.target.value.trim()) trackPlausibleEvent("cfa_form_cause_rupture_saisie");
          }}
          className={`fr-input ${causeMeta.touched && causeMeta.error ? "fr-input--error" : ""}`}
          placeholder="Soyez suffisamment précis pour que la Mission locale puisse comprendre le contexte."
          rows={5}
        />
        <ErrorMessage name="cause_rupture" component="p" className="fr-error-text" />
      </div>
    </div>
  );
}
