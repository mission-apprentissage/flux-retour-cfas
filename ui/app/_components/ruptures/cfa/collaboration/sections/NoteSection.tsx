import { useField } from "formik";

import styles from "../CollaborationForm.module.css";

export function NoteSection() {
  const [field] = useField("note_complementaire");

  return (
    <div className={styles.sectionBlock}>
      <p className={styles.sectionLabel}>
        Une note ou un commentaire en plus que vous aimeriez donner à la Mission locale ?{" "}
        <span className={styles.sectionHintInline}>Facultatif</span>
      </p>
      <textarea
        {...field}
        className="fr-input"
        placeholder="Décrivez ce que vous attendez de la Mission locale, le niveau d'urgence de la situation du jeune ou ajoutez une note utile à la Mission locale."
        rows={4}
      />
    </div>
  );
}
