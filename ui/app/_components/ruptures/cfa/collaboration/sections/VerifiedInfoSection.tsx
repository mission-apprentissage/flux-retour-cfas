import { useState } from "react";

import styles from "../CollaborationForm.module.css";
import { VERIFIED_FIELDS } from "../constants";
import { VerifiedInfo } from "../hooks";
import { formatAdresseDisplay } from "../utils";

interface VerifiedInfoSectionProps {
  verifiedInfo: VerifiedInfo;
  setFieldValue: (field: string, value: unknown) => void;
  submitCount: number;
  fieldErrors?: Partial<Record<keyof VerifiedInfo, string>>;
}

export function VerifiedInfoSection({
  verifiedInfo,
  setFieldValue,
  submitCount,
  fieldErrors,
}: VerifiedInfoSectionProps) {
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());

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

  const setVerifiedField = (key: keyof VerifiedInfo, value: string) => {
    setFieldValue(`verified_info.${key}`, value);
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
          const isEditing = editingFields.has(field.key);
          const isEmpty = !verifiedInfo[field.key]?.trim();
          const showFieldError = submitCount > 0 && field.required && isEmpty;
          const formatError = submitCount > 0 ? fieldErrors?.[field.key] : undefined;

          if (field.isAddress) {
            return (
              <AddressRow
                key="adresse"
                field={field}
                verifiedInfo={verifiedInfo}
                isEditing={editingFields.has("adresse")}
                showError={submitCount > 0}
                onToggleEdit={() => toggleEdit("adresse")}
                onFieldChange={setVerifiedField}
              />
            );
          }

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
                      className={`fr-input ${showFieldError || formatError ? styles.inputError : ""}`}
                      value={verifiedInfo[field.key]}
                      onChange={(e) => setVerifiedField(field.key, e.target.value)}
                    />
                    {formatError && <span className={styles.infoRequise}>{formatError}</span>}
                  </>
                ) : (
                  <>
                    <span>{verifiedInfo[field.key] || "—"}</span>
                    {showFieldError && <span className={styles.infoRequise}>information requise</span>}
                    {!showFieldError && formatError && <span className={styles.infoRequise}>{formatError}</span>}
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
  verifiedInfo: VerifiedInfo;
  isEditing: boolean;
  showError: boolean;
  onToggleEdit: () => void;
  onFieldChange: (key: keyof VerifiedInfo, value: string) => void;
}

function AddressRow({ field, verifiedInfo, isEditing, showError, onToggleEdit, onFieldChange }: AddressRowProps) {
  const adresseDisplay = formatAdresseDisplay(verifiedInfo);
  const adresseEmpty =
    !verifiedInfo.adresse_rue.trim() ||
    !verifiedInfo.adresse_code_postal.trim() ||
    !verifiedInfo.adresse_commune.trim();
  const showAddrError = showError && adresseEmpty;

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
              className={`fr-input ${showAddrError && !verifiedInfo.adresse_rue.trim() ? styles.inputError : ""}`}
              placeholder="Rue"
              value={verifiedInfo.adresse_rue}
              onChange={(e) => onFieldChange("adresse_rue", e.target.value)}
            />
            <div className={styles.addressEditRow}>
              <input
                type="text"
                className={`fr-input ${showAddrError && !verifiedInfo.adresse_code_postal.trim() ? styles.inputError : ""}`}
                placeholder="Code postal"
                value={verifiedInfo.adresse_code_postal}
                onChange={(e) => onFieldChange("adresse_code_postal", e.target.value)}
              />
              <input
                type="text"
                className={`fr-input ${showAddrError && !verifiedInfo.adresse_commune.trim() ? styles.inputError : ""}`}
                placeholder="Commune"
                value={verifiedInfo.adresse_commune}
                onChange={(e) => onFieldChange("adresse_commune", e.target.value)}
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
