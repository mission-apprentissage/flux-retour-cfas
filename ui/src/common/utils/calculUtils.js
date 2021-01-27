export const getItemsRate = (nbItems, nbTotalItems) => roundToTwo((nbItems / nbTotalItems) * 100);
export const roundToTwo = (value) => Math.round(value * 100) / 100;
