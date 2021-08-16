const AUGUST_MONTH_INDEX = 7;

// annee scolaire is from 1st of August of year n to 31st of July of year n+1
// for example 01/08/2020 to 31/07/2021
const getNewAnneeScolaireDateForYear = (year) => {
  return new Date(Date.UTC(year, AUGUST_MONTH_INDEX, 1));
};

const getAnneeScolaireFromDate = (date) => {
  const dateYear = date.getFullYear();
  if (date.getTime() >= getNewAnneeScolaireDateForYear(dateYear).getTime()) {
    return `${dateYear}-${dateYear + 1}`;
  }
  return `${dateYear - 1}-${dateYear}`;
};

module.exports = {
  getAnneeScolaireFromDate,
};
