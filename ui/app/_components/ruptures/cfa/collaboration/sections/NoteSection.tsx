import { useField } from "formik";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import styles from "../CollaborationForm.module.css";

export function NoteSection() {
  const [field] = useField("note_complementaire");
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  return (
    <div className={styles.sectionBlock}>
      <p className={styles.sectionLabel}>
        Une note ou un commentaire en plus que vous aimeriez donner à la Mission locale ?{" "}
        <span className={styles.sectionHintInline}>Facultatif</span>
      </p>
      <textarea
        {...field}
        onBlur={(e) => {
          field.onBlur(e);
          if (e.target.value.trim()) trackPlausibleEvent("cfa_form_note_saisie");
        }}
        className="fr-input"
        placeholder="Décrivez ce que vous attendez de la Mission locale, le niveau d'urgence de la situation du jeune ou ajoutez une note utile à la Mission locale."
        rows={4}
      />
    </div>
  );
}
