import styles from "../CollaborationForm.module.css";

interface CauseRuptureSectionProps {
  value: string;
  setFieldValue: (field: string, value: unknown) => void;
  error?: string;
  submitCount: number;
}

export function CauseRuptureSection({ value, setFieldValue, error, submitCount }: CauseRuptureSectionProps) {
  const showError = submitCount > 0 && !!error;

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
        className={`fr-input ${showError ? styles.inputError : ""}`}
        placeholder="Décrivez les circonstances de la rupture..."
        value={value}
        onChange={(e) => setFieldValue("cause_rupture", e.target.value)}
        rows={5}
      />
      {showError && <p className={styles.errorText}>Ce champ est obligatoire</p>}
    </div>
  );
}
