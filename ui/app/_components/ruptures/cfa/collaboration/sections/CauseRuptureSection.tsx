import { ErrorMessage, useField } from "formik";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import styles from "../CollaborationForm.module.css";

export function CauseRuptureSection() {
  const [field, meta] = useField("cause_rupture");
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  return (
    <div className={styles.sectionBlock}>
      <p className={styles.sectionLabel}>
        Pouvez-vous nous en dire plus sur la cause et les circonstances de la rupture ?
        <span className={styles.required}>*</span>
      </p>
      <p className={styles.sectionHint}>
        Décrivez ce qu&apos;il s&apos;est passé dans les faits (ex: problème d&apos;organisation d&apos;emploi du temps,
        faute grave professionnelle, l&apos;employeur n&apos;a pas mis à disposition de tuteur...)
      </p>
      <textarea
        {...field}
        onBlur={(e) => {
          field.onBlur(e);
          if (e.target.value.trim()) trackPlausibleEvent("cfa_form_cause_rupture_saisie");
        }}
        className={`fr-input ${meta.touched && meta.error ? "fr-input--error" : ""}`}
        placeholder="Décrivez les circonstances de la rupture..."
        rows={5}
      />
      <ErrorMessage name="cause_rupture" component="p" className="fr-error-text" />
    </div>
  );
}
