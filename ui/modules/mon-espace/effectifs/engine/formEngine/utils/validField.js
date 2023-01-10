import { isEmptyValue } from "./isEmptyValue";
import * as Yup from "yup";

export const validField = async ({ field, value }) => {
  if (field.required && isEmptyValue(value)) {
    return { error: field.requiredMessage ?? "Ce champ est obligatoire" };
  }

  if (field.fieldType === "phone" && field.extra?.countryCode === "fr" && value.length !== 12) {
    return { error: "Le numéro de téléphone n'est pas au bon format" };
  }

  if (value && field.fieldType === "email" && !(await isValidEmail(value))) {
    return { error: "Le courriel doit être au format correct" };
  }

  if (value && field.pattern && !new RegExp(field.pattern).test(value)) {
    return { error: field?.validateMessage ?? "Le format ne correspond pas" };
  }

  if (value && field.enum && field.enum.indexOf(value) === -1) {
    return { error: field?.validateMessage ?? "Le format ne correspond pas" };
  }

  if (field.maxLength && value?.length > field.maxLength) {
    return { error: field?.validateMessage ?? "La valeur est trop longue" };
  }

  if (field.minLength && value?.length < field.minLength) {
    return { error: field?.validateMessage ?? "La valeur est trop courte" };
  }

  return (await field?.validate?.({ value })) ?? {};
};

const emailValidator = Yup.string().email("Le courriel doit être au format correct");
const isValidEmail = async (value) => {
  try {
    await emailValidator.validate(value);
    return true;
  } catch (e) {
    return false;
  }
};
