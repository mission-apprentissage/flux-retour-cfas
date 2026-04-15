import { getIn, useFormikContext } from "formik";
import { useRef, useState } from "react";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import styles from "../CollaborationForm.module.css";
import { VERIFIED_FIELDS } from "../constants";
import { FormValues } from "../types";
import { formatAdresseDisplay } from "../utils";

export function VerifiedInfoSection() {
  const { values, errors, touched, handleChange, handleBlur } = useFormikContext<FormValues>();
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const verifiedInfo = values.verified_info;
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const trackedFieldsRef = useRef<Set<string>>(new Set());

  const toggleEdit = (key: string) => {
    setEditingFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className={styles.sectionBlock}>
      <p className={styles.sectionLabel}>Informations de l&apos;apprenant à vérifier</p>
      <p className={styles.sectionHint}>
        Complétez les informations requises et utilisez le pictogramme du crayon pour corriger les informations
        erronées.
      </p>
      <div className={styles.verifiedTable}>
        {VERIFIED_FIELDS.map((field) => {
          if (field.isAddress) {
            return (
              <AddressRow
                key="adresse"
                field={field}
                isEditing={editingFields.has("adresse")}
                onToggleEdit={() => toggleEdit("adresse")}
              />
            );
          }

          const isEditing = editingFields.has(field.key);
          const fieldPath = `verified_info.${field.key}`;
          const isEmpty = !verifiedInfo[field.key]?.trim();
          const isTouched = getIn(touched, fieldPath);
          const fieldError = getIn(errors, fieldPath) as string | undefined;
          const hasError = isTouched && !!fieldError;
          const isFormatError = hasError && !isEmpty;

          return (
            <div key={field.key} className={styles.verifiedRow}>
              <div className={styles.verifiedLabel}>
                {field.label}
                {field.required && <span className={styles.required}>*</span>}
              </div>
              <div className={styles.verifiedValue}>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name={fieldPath}
                      className={`fr-input ${hasError ? "fr-input--error" : ""}`}
                      value={verifiedInfo[field.key]}
                      onChange={handleChange}
                      onBlur={(e) => {
                        handleBlur(e);
                        if (!trackedFieldsRef.current.has(field.key)) {
                          trackedFieldsRef.current.add(field.key);
                          trackPlausibleEvent("cfa_form_coordonnees_modifiees", undefined, { champ: field.key });
                        }
                      }}
                    />
                    {isFormatError && <span className={styles.infoRequise}>{fieldError}</span>}
                  </>
                ) : (
                  <>
                    <span>{verifiedInfo[field.key] || "—"}</span>
                    {hasError && (
                      <span className={styles.infoRequise}>{isEmpty ? "information requise" : fieldError}</span>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => toggleEdit(field.key)}
                title="Modifier"
              >
                <span className="fr-icon-pencil-line" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AddressRowProps {
  field: { label: string; required: boolean };
  isEditing: boolean;
  onToggleEdit: () => void;
}

function AddressRow({ field, isEditing, onToggleEdit }: AddressRowProps) {
  const { values, errors, touched, handleChange, handleBlur } = useFormikContext<FormValues>();
  const verifiedInfo = values.verified_info;
  const adresseDisplay = formatAdresseDisplay(verifiedInfo);

  const showRueError = getIn(touched, "verified_info.adresse_rue") && getIn(errors, "verified_info.adresse_rue");
  const showCpError =
    getIn(touched, "verified_info.adresse_code_postal") && getIn(errors, "verified_info.adresse_code_postal");
  const showCommuneError =
    getIn(touched, "verified_info.adresse_commune") && getIn(errors, "verified_info.adresse_commune");
  const showAddrError = showRueError || showCpError || showCommuneError;

  return (
    <div className={styles.verifiedRow}>
      <div className={styles.verifiedLabel}>
        {field.label}
        {field.required && <span className={styles.required}>*</span>}
      </div>
      <div className={styles.verifiedValue}>
        {isEditing ? (
          <div className={styles.addressEditGroup}>
            <input
              type="text"
              name="verified_info.adresse_rue"
              className={`fr-input ${showRueError ? "fr-input--error" : ""}`}
              placeholder="Rue"
              value={verifiedInfo.adresse_rue}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <div className={styles.addressEditRow}>
              <input
                type="text"
                name="verified_info.adresse_code_postal"
                className={`fr-input ${showCpError ? "fr-input--error" : ""}`}
                placeholder="Code postal"
                value={verifiedInfo.adresse_code_postal}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <input
                type="text"
                name="verified_info.adresse_commune"
                className={`fr-input ${showCommuneError ? "fr-input--error" : ""}`}
                placeholder="Commune"
                value={verifiedInfo.adresse_commune}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
          </div>
        ) : (
          <>
            <span>{adresseDisplay || "—"}</span>
            {showAddrError && <span className={styles.infoRequise}>information incomplète</span>}
          </>
        )}
      </div>
      <button type="button" className={styles.editButton} onClick={onToggleEdit} title="Modifier">
        <span className="fr-icon-pencil-line" aria-hidden="true" />
      </button>
    </div>
  );
}
