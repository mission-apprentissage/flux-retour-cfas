import format from "date-fns/format/index";
import { fr } from "date-fns/locale";

export function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR");
}

export function getAge(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const dob = new Date(dateString);
  let age = now.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  return age;
}

export function getMonthYearFromDate(dateString) {
  if (!dateString) return "Non renseigné";
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR", { month: "long", year: "numeric" });
}

export function formatDateWithTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMonthAndYear(dateString: string) {
  const date = new Date(dateString);
  return format(date, "MMMM yyyy", { locale: fr });
}
