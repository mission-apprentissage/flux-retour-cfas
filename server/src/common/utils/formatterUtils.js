import { DateTime } from "luxon";

export function dateFormatter(dateString) {
  return dateString.replaceAll("-", "/");
}

export function dateStringToLuxon(dateString, format = "dd/MM/yyyy") {
  return DateTime.fromFormat(dateString, format).setLocale("fr-FR");
}
