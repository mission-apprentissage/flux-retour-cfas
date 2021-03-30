const getPercentageDifference = (count1 = 0, count2 = 0) => {
  if (count2 === 0) return null;
  const result = ((count1 - count2) * 100) / count2;
  return Math.round(result * 100) / 100;
};
module.exports.getPercentageDifference = getPercentageDifference;
