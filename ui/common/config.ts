import { formatDate } from "./utils/dateUtils";

export const config = {
  APPLICATION_DATE: valueOrDefault("{{APPLICATION_DATE}}", formatDate(new Date(), "dd/MM/yyyy")),
  APPLICATION_VERSION: valueOrDefault("{{APPLICATION_VERSION}}", "dev"),

  // TODO regrouper tous les process.env ici pour centraliser la configuration possible
};

function valueOrDefault(value: string, defaultValue: any): string {
  return !value.startsWith("{{") ? value : defaultValue;
}
