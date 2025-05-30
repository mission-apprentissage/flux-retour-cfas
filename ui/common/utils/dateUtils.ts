// eslint-disable-next-line import/no-duplicates
import { format } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import { fr } from "date-fns/locale";

// TODO [tech] TO REMOVE
export const prettyPrintDate = (date) => {
  const event = new Date(date);
  const options = {
    hour: "2-digit" as const,
    minute: "2-digit" as const,
    year: "numeric" as const,
    month: "short" as const,
    day: "numeric" as const,
  };

  return event.toLocaleDateString("fr-FR", options);
};

/**
 * Formate une date selon le format en paramètre
 */
export const formatDate = (date: Date, dateFormat: string) => format(date, dateFormat, { locale: fr });

export const formatDateDayMonthYear = (date: string | Date) => {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

export const formatDateNumericDayMonthYear = (date: string) => {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "numeric", year: "numeric" });
};

export const formatDateHourMinutesSecondsMs = (date: string) => {
  const d = new Date(date);

  return Intl.DateTimeFormat("fr-FR", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).format(d);
};

export const calculateAge = (dateOfBirth: string | Date): number | null => {
  if (!dateOfBirth) {
    return null;
  }

  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
};
