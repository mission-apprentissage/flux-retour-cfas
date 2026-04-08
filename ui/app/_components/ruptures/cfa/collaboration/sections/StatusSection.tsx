import { ErrorMessage, useFormikContext } from "formik";

import styles from "../CollaborationForm.module.css";
import { FormValues } from "../types";

export function StatusSection() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <>
      <p className={styles.radioLabel}>
        Le jeune est-il toujours en formation au CFA <span className={styles.required}>*</span>
      </p>
      <p className={styles.radioHint}>Le jeune est-il maintenu en cours ?</p>
      <div className={styles.radioCardGroup}>
        {(
          [
            { value: true, label: "Oui" },
            { value: false, label: "Non" },
          ] as const
        ).map(({ value: optionValue, label }) => (
          <label
            key={String(optionValue)}
            className={`${styles.radioCard} ${values.still_at_cfa === optionValue ? styles.radioCardSelected : ""}`}
          >
            <input
              type="radio"
              name="still_at_cfa"
              checked={values.still_at_cfa === optionValue}
              onChange={() => setFieldValue("still_at_cfa", optionValue)}
              className={styles.radioInput}
            />
            {label}
          </label>
        ))}
      </div>
      <ErrorMessage name="still_at_cfa" component="p" className="fr-error-text" />
    </>
  );
}
