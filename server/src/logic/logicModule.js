/**
 * Example logic module
 */
module.exports = {
  getTestMessage: (testValue) => {
    return `${testValue} Message`;
  },
  compare: (value1, value2) => {
    return value2 === value1;
  },
};
