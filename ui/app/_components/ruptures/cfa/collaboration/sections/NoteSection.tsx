import styles from "../CollaborationForm.module.css";

interface NoteSectionProps {
  value: string;
  setFieldValue: (field: string, value: unknown) => void;
}

export function NoteSection({ value, setFieldValue }: NoteSectionProps) {
  return (
    <div className={styles.sectionBlock}>
      <p className={styles.sectionLabel}>
        Une note ou un commentaire en plus que vous aimeriez donner à la Mission locale ?{" "}
        <span className={styles.sectionHintInline}>Facultatif</span>
      </p>
      <textarea
        className="fr-input"
        placeholder="Décrivez ce que vous attendez de la Mission locale, le niveau d'urgence de la situation du jeune ou ajoutez une note utile à la Mission locale."
        value={value}
        onChange={(e) => setFieldValue("note_complementaire", e.target.value)}
        rows={4}
      />
    </div>
  );
}
