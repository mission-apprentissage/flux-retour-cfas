import get from "lodash.get";
import { DateTime } from "luxon";

import { formatPhoneNumber } from "@/app/_utils/phone.utils";

import { effectifFieldsSchema } from "./schema";

export interface EffectifValidationError {
  fieldName: string;
  inputValue?: string;
}

export type EffectifFormData = Record<string, unknown>;

interface EffectifFieldSchema {
  label?: string;
  description?: string;
  showInfo?: boolean;
  fieldType?: string;
  options?: Array<{ value: unknown; label: string }>;
}

export interface EffectifFieldView {
  name: string;
  label: string;
  value: string;
  description?: string;
  error?: string;
}

const NON_RENSEIGNE = "Non renseigné";

const formatValue = (fieldSchema: EffectifFieldSchema | undefined, rawValue: unknown): string => {
  if (rawValue === undefined || rawValue === null || rawValue === "") return NON_RENSEIGNE;

  if (Array.isArray(fieldSchema?.options)) {
    const option = fieldSchema.options.find((item) => item.value === rawValue || `${item.value}` === `${rawValue}`);
    if (option) return option.label;
  }

  switch (fieldSchema?.fieldType) {
    case "date":
      return DateTime.fromISO(`${rawValue}`).setLocale("fr-FR").toFormat("dd/MM/yyyy");
    case "phone":
      return formatPhoneNumber(`${rawValue}`) ?? `${rawValue}`;
    case "consent":
      return rawValue === true || rawValue === "true" ? "Oui" : "Non";
    default:
      return `${rawValue}`;
  }
};

/**
 * Le schéma du moteur porte les libellés, les options et les infobulles de chaque champ :
 * il reste la source de vérité de l'affichage, la machinerie de saisie en moins.
 */
const buildFieldView = (
  effectif: EffectifFormData,
  name: string,
  validationErrors: EffectifValidationError[] = []
): EffectifFieldView | null => {
  const fieldSchema: EffectifFieldSchema | undefined = effectifFieldsSchema[name];
  if (!fieldSchema) return null;

  const data = get(effectif, name) as { value?: unknown; description?: string } | undefined;
  const validationError = validationErrors.find((error) => error.fieldName === name);

  return {
    name,
    label: `${fieldSchema.label ?? name}`.replace(/\s*:\s*$/, ""),
    value: formatValue(fieldSchema, data?.value),
    description: fieldSchema.showInfo ? data?.description : fieldSchema.description,
    error: validationError ? `Donnée transmise non valide : « ${validationError.inputValue || "vide"} »` : undefined,
  };
};

export const buildFieldViews = (
  effectif: EffectifFormData,
  names: string[],
  validationErrors: EffectifValidationError[] = []
): EffectifFieldView[] =>
  names.map((name) => buildFieldView(effectif, name, validationErrors)).filter(Boolean) as EffectifFieldView[];

export const getRawValue = (effectif: EffectifFormData, name: string): unknown =>
  (get(effectif, name) as { value?: unknown } | undefined)?.value;
