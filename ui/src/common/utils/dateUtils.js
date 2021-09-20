import { endOfMonth, format } from "date-fns";

const DATE_FORMAT = "dd/MM/yyyy";

/**
 * Formate une date dans le format dd/MM/yyyy
 * @param {Date | number} date
 */
export const formatDate = (date) => (date ? format(date, DATE_FORMAT) : "");

// Elle vérifie si la date est aprés le dernier jour du mois #BestPractices
export const isDateFuture = (date) => date > endOfMonth(new Date());
