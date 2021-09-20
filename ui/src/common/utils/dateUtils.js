import { format } from "date-fns";

const DATE_FORMAT = "dd/MM/yyyy";

/**
 * Formate une date dans le format dd/MM/yyyy
 * @param {Date | number} date
 */
export const formatDate = (date) => {
  return date ? format(date, DATE_FORMAT) : "";
};
var today = new Date();
var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

export const isDateFuture = (date) => {
  if (date <= lastDayOfMonth) {
    return true;
  }
  return false;
};
