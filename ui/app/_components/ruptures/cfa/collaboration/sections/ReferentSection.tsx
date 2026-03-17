import { useAuth } from "@/app/_context/UserContext";

import styles from "../CollaborationForm.module.css";
import { FormValues } from "../types";

interface ReferentSectionProps {
  prenom: string;
  values: FormValues;
  setFieldValue: (field: string, value: unknown) => void;
  error?: string;
  submitCount: number;
}

export function ReferentSection({ prenom, values, setFieldValue, error, submitCount }: ReferentSectionProps) {
  const { user } = useAuth();
  const showError = submitCount > 0 && !!error;

  return (
    <div className={styles.sectionBlock}>
      <p className={styles.sectionLabel}>
        Si la Mission Locale devait contacter quelqu&apos;un sur le dossier de{" "}
        <span className={styles.titleHighlight}>{prenom}</span>, qui est-ce ?<span className={styles.required}>*</span>
      </p>
      <div className={styles.referentCardGroup}>
        <div
          className={`${styles.referentCard} ${values.referent_type === "me" ? `${styles.referentCardSelected} ${styles.referentCardColumn}` : ""}`}
          onClick={() => setFieldValue("referent_type", "me")}
        >
          <label className={styles.referentCardLabel}>
            <input
              type="radio"
              name="referent_type"
              checked={values.referent_type === "me"}
              onChange={() => setFieldValue("referent_type", "me")}
              className={styles.radioInput}
            />
            <span>Me contacter uniquement</span>
          </label>
          {values.referent_type === "me" && (
            <div className={styles.referentPreview}>
              <div>
                {user?.civility === "Madame" ? "Mme" : "M."} {user?.prenom} {user?.nom?.toUpperCase()}
              </div>
              {user?.telephone && <div>{user.telephone}</div>}
              {user?.email && <div>{user.email}</div>}
            </div>
          )}
        </div>

        <div
          className={`${styles.referentCard} ${styles.referentCardColumn} ${values.referent_type === "other" ? styles.referentCardSelected : ""}`}
          onClick={() => setFieldValue("referent_type", "other")}
        >
          <label className={styles.referentCardLabel}>
            <input
              type="radio"
              name="referent_type"
              checked={values.referent_type === "other"}
              onChange={() => setFieldValue("referent_type", "other")}
              className={styles.radioInput}
            />
            <span>Ajouter les coordonnées d&apos;un(e) référent(e)</span>
            <span className={`fr-icon-user-add-fill fr-icon--sm ${styles.referentIcon}`} aria-hidden="true" />
          </label>
          {values.referent_type === "other" && (
            <textarea
              className={`fr-input ${showError && !values.referent_details.trim() ? styles.inputError : ""}`}
              placeholder="Nom, prénom, téléphone et email du référent"
              value={values.referent_details}
              onChange={(e) => setFieldValue("referent_details", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              rows={2}
            />
          )}
        </div>
      </div>
      {showError && <p className={styles.errorText}>Veuillez indiquer un contact</p>}
    </div>
  );
}
