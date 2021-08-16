const { isAfter } = require("date-fns");

const AUGUST_MONTH_INDEX = 7;

const getNewAnneeScolaireDateForYear = (year) => {
  return new Date(year, AUGUST_MONTH_INDEX, 1);
};

const getAnneeScolaireFromDate = (date) => {
  const dateYear = date.getFullYear();
  if (isAfter(date, getNewAnneeScolaireDateForYear(dateYear))) {
    return `${dateYear}-${dateYear + 1}`;
  }
  return `${dateYear - 1}-${dateYear}`;
};

module.exports = {
  getAnneeScolaireFromDate,
};
