const containsSubArray = (array, subArray) => {
  if (!Array.isArray(array) || !Array.isArray(subArray) || subArray.length > array.length) return false;

  for (var i = 0; i < array.length; i++) {
    let found = true;
    for (var j = 0; j < subArray.length; j++) {
      if (array[i + j] !== subArray[j]) {
        found = false;
        break;
      }
    }
    if (found) return true;
  }
  return false;
};

const countSubArrayInArray = (array, subArray) => {
  let nbOccurences = 0;
  if (!Array.isArray(array) || !Array.isArray(subArray) || subArray.length > array.length) return nbOccurences;

  for (var i = 0; i < array.length; i++) {
    let found = true;
    for (var j = 0; j < subArray.length; j++) {
      if (array[i + j] !== subArray[j]) {
        found = false;
        break;
      }
    }
    if (found) nbOccurences++;
  }
  return nbOccurences;
};

module.exports = {
  containsSubArray,
  countSubArrayInArray,
};
