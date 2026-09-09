import get from "lodash.get";
import { DateTime } from "luxon";

import { formatPhoneNumber } from "@/app/_utils/phone.utils";

import { effectifFieldsSchema } from "./schema";

export interface EffectifFieldView {
  name: string;
  label: string;
  value: string;
  description?: string;
  error?: string;
}

const NON_RENSEIGNE = "Non renseigné";

const formatValue = (fieldSchema: any, rawValue: any): string => {
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
const buildFieldView = (effectif: any, name: string, validationErrors: any[] = []): EffectifFieldView | null => {
  const fieldSchema = effectifFieldsSchema[name];
  if (!fieldSchema) return null;

  const data = get(effectif, name);
  const validationError = validationErrors.find((error) => error.fieldName === name);

  return {
    name,
    label: `${fieldSchema.label ?? name}`.replace(/\s*:\s*$/, ""),
    value: formatValue(fieldSchema, data?.value),
    description: fieldSchema.showInfo ? data?.description : fieldSchema.description,
    error: validationError ? `Donnée transmise non valide : « ${validationError.inputValue || "vide"} »` : undefined,
  };
};

export const buildFieldViews = (effectif: any, names: string[], validationErrors: any[] = []): EffectifFieldView[] =>
  names.map((name) => buildFieldView(effectif, name, validationErrors)).filter(Boolean) as EffectifFieldView[];

export const getRawValue = (effectif: any, name: string) => get(effectif, name)?.value;
