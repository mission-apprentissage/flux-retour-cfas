"use client";

import { useField } from "formik";
import { ReactNode } from "react";

import styles from "./Tunnel.module.css";

export interface RadioCardOption<T extends string | boolean> {
  value: T;
  label: ReactNode;
  hint?: string;
}

interface RadioCardGroupProps<T extends string | boolean> {
  name: string;
  options: RadioCardOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export function RadioCardGroup<T extends string | boolean>({ name, options, value, onChange }: RadioCardGroupProps<T>) {
  const [, meta] = useField(name);
  const enErreur = Boolean(meta.touched && meta.error);
  const idErreur = `${name}-error`;

  return (
    <div className={styles.fieldGroup}>
      <div className={`${styles.radioGroup} ${enErreur ? styles.radioGroupError : ""}`}>
        {options.map((option) => (
          <label
            key={String(option.value)}
            className={`${styles.radioCard} ${value === option.value ? styles.radioCardSelected : ""}`}
          >
            <input
              type="radio"
              name={name}
              className={styles.radioInput}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-describedby={enErreur ? idErreur : undefined}
            />
            <span className={styles.radioLabelText}>
              <span>{option.label}</span>
              {option.hint && <span className={styles.radioHint}>{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {enErreur && (
        <p id={idErreur} className="fr-error-text">
          {meta.error}
        </p>
      )}
    </div>
  );
}
