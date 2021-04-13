export const roundToTwo = (value) => Math.round(value * 100) / 100;
export const roundToOne = (value) => Math.round(value * 100) / 100;

export const getPercentageDifference = (count1, count2) => {
  if (count2 === 0) return null;
  return ((count1 - count2) * 100) / count2;
};

export const getPercentage = (value, total) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

export const getRoundedPercentage = (value, total) => {
  if (total === 0) return 0;
  return roundToTwo((value / total) * 100);
};
