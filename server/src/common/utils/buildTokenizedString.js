const buildTokenizedString = (string = "", minGram = 1) => {
  const separator = " ";

  return string
    .split(separator)
    .reduce((memo, token) => {
      for (let i = minGram; i <= token.length; i++) {
        memo = [...memo, token.substr(0, i)];
      }
      return memo;
    }, [])
    .join(" ");
};

module.exports = { buildTokenizedString };
