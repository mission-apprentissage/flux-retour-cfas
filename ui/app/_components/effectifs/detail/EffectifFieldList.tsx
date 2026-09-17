"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import styles from "./effectif-detail.module.scss";
import { EffectifFieldView } from "./effectifFields";

export function EffectifFieldList({ fields, title }: { fields: EffectifFieldView[]; title?: string }) {
  if (fields.length === 0) return null;

  return (
    <div className={styles.fieldList}>
      {title && <p className={styles.blockTitle}>{title}</p>}
      <dl>
        {fields.map((field) => (
          <div key={field.name} className={styles.field}>
            <dt className={styles.fieldLabel}>
              {field.label}
              {field.description && (
                <>
                  {" "}
                  <Tooltip kind="hover" title={field.description} />
                </>
              )}
            </dt>
            <dd className={`${styles.fieldValue} ${field.value === "Non renseigné" ? styles.fieldValueEmpty : ""}`}>
              {field.value}
            </dd>
            {field.error && <p className={styles.fieldError}>{field.error}</p>}
          </div>
        ))}
      </dl>
    </div>
  );
}
