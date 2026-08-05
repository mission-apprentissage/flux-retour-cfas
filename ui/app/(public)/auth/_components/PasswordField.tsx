"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useState, type ReactNode } from "react";

import styles from "./password-field.module.scss";
import { getPasswordRules } from "./passwordRules";

export function PasswordField({
  label,
  id,
  name,
  value,
  placeholder,
  minLength,
  hasError = false,
  onChange,
  onBlur,
}: {
  label: ReactNode;
  id: string;
  name: string;
  value: string;
  placeholder?: string;
  minLength: number;
  hasError?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}) {
  const [shown, setShown] = useState(false);

  return (
    <>
      <Input
        label={label}
        state={hasError ? "error" : "default"}
        nativeInputProps={{
          id,
          name,
          type: shown ? "text" : "password",
          autoComplete: "new-password",
          value,
          placeholder,
          onChange,
          onBlur,
        }}
        action={
          <Button
            type="button"
            priority="tertiary no outline"
            iconId={shown ? "ri-eye-off-line" : "ri-eye-line"}
            title={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setShown((wasShown) => !wasShown)}
          />
        }
      />

      <div className={`${fr.cx("fr-messages-group")} ${styles.rules}`} aria-live="polite">
        <p className={fr.cx("fr-message")}>Votre mot de passe doit contenir :</p>
        {getPasswordRules(minLength).map((rule, index) => (
          <p
            key={index}
            className={fr.cx(
              "fr-message",
              !value ? "fr-message--info" : rule.isSatisfied(value.trim()) ? "fr-message--valid" : "fr-message--error"
            )}
          >
            {rule.label}
          </p>
        ))}
      </div>
    </>
  );
}
