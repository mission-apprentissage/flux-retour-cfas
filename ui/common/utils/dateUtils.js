import { endOfMonth, format } from "date-fns";

const DATE_FORMAT = "dd/MM/yyyy";

// TODO [tech] TO REMOVE
export const prettyPrintDate = (date) => {
  const event = new Date(date);
  const options = { hour: "2-digit", minute: "2-digit", year: "numeric", month: "short", day: "numeric" };

  return event.toLocaleDateString("fr-FR", options);
};

/**
 * Formate une date dans le format dd/MM/yyyy
 * @param {Date | number} date
 */
export const formatDate = (date) => (date ? format(date, DATE_FORMAT) : "");

// Elle vérifie si la date est aprés le dernier jour du mois
export const isDateFuture = (date) => date > endOfMonth(new Date());

export const formatDateDayMonthYear = (date) => {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

export const formatDateNumericDayMonthYear = (date) => {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "numeric", year: "numeric" });
};

export const getUniquesMonthAndYearFromDatesList = (input) => {
  const output = [];

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
