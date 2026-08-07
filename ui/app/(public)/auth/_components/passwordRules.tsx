import type { ReactNode } from "react";

// Les libellés sont enveloppés dans un <span> unique : `.fr-message` est en
// display:flex, sans quoi l'espace avant le <strong> est supprimé au rendu.
type PasswordRule = {
  label: ReactNode;
  isSatisfied: (password: string) => boolean;
  message: string;
};

export const ADMIN_PASSWORD_MIN_LENGTH = 20;
export const DEFAULT_PASSWORD_MIN_LENGTH = 12;

export const getPasswordRules = (minLength: number): PasswordRule[] => [
  {
    label: (
      <span>
        au moins <strong>{minLength} caractères</strong>
      </span>
    ),
    isSatisfied: (password) => password.length >= minLength,
    message: `Le mot de passe doit contenir au moins ${minLength} caractères`,
  },
  {
    label: (
      <span>
        au moins <strong>une lettre minuscule</strong>
      </span>
    ),
    isSatisfied: (password) => /[a-z]/.test(password),
    message: "Le mot de passe doit contenir au moins une lettre minuscule",
  },
  {
    label: (
      <span>
        au moins <strong>une lettre majuscule</strong>
      </span>
    ),
    isSatisfied: (password) => /[A-Z]/.test(password),
    message: "Le mot de passe doit contenir au moins une lettre majuscule",
  },
  {
    label: (
      <span>
        au moins <strong>un caractère spécial</strong>
      </span>
    ),
    isSatisfied: (password) => /[^\w\d\s:]/.test(password),
    message: "Le mot de passe doit contenir au moins un caractère spécial",
  },
  {
    label: (
      <span>
        au moins <strong>un chiffre</strong>
      </span>
    ),
    isSatisfied: (password) => /[0-9]/.test(password),
    message: "Le mot de passe doit contenir au moins un chiffre",
  },
];

export const getPasswordError = (password: string, minLength: number): string | undefined => {
  if (!password) return "Veuillez saisir un mot de passe";
  return getPasswordRules(minLength).find((rule) => !rule.isSatisfied(password.trim()))?.message;
};
