import fr, { endOfMonth, format } from "date-fns";

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

// Elle vérifie si la date est aprés le dernier jour du mois
export const isDateFuture = (date) => date > endOfMonth(new Date());

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
    fractionalSecondDigits: 3,
  }).format(d);
};

export const getUniquesMonthAndYearFromDatesList = (input: { date: string | Date }[]) => {
  const output: Date[] = [];

  input.forEach((element) => {
    const date = new Date(element.date);
    const hasDateWithSameMonth =
      output.findIndex((item) => {
        return date.getFullYear() === item.getFullYear() && date.getMonth() === item.getMonth();
      }) !== -1;

    if (!hasDateWithSameMonth) output.push(date);
  });
  return output;
};
