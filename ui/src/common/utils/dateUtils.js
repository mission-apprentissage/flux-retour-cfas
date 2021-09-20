import { endOfMonth, format, isThisMonth } from "date-fns";

const DATE_FORMAT = "dd/MM/yyyy";

/**
 * Formate une date dans le format dd/MM/yyyy
 * @param {Date | number} date
 */
export const formatDate = (date) => {
  return date ? format(date, DATE_FORMAT) : "";
};

export const isDateFuture = (date) => {
  const lastDayOfMonth = endOfMonth(new Date());
  const laDate = isThisMonth(lastDayOfMonth) ? new Date() : lastDayOfMonth;
  if (date < laDate) return true;
  return false;
};
