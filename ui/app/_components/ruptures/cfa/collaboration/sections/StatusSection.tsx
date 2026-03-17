import styles from "../CollaborationForm.module.css";

interface StatusSectionProps {
  value: boolean | null;
  setFieldValue: (field: string, value: unknown) => void;
  error?: string;
  submitCount: number;
}

export function StatusSection({ value, setFieldValue, error, submitCount }: StatusSectionProps) {
  const showError = submitCount > 0 && !!error;

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
            className={`${styles.radioCard} ${value === optionValue ? styles.radioCardSelected : ""}`}
          >
            <input
              type="radio"
              name="still_at_cfa"
              checked={value === optionValue}
              onChange={() => setFieldValue("still_at_cfa", optionValue)}
              className={styles.radioInput}
            />
            {label}
          </label>
        ))}
      </div>
      {showError && <p className={styles.errorText}>Ce champ est obligatoire</p>}
    </>
  );
}
