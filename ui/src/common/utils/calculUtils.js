export const getItemsRate = (nbItems, nbTotalItems) => roundToTwo((nbItems / nbTotalItems) * 100);
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
