export const buildTokenizedString = (string = "", minGram = 1) => {
  const separator = " ";

  return string
    .split(separator)
    .reduce((/** @type {string[]}*/ memo: string[], token: string) => {
      for (let i = minGram; i <= token.length; i++) {
        memo = [...memo, token.slice(0, i)];
      }
      return memo;
    }, [])
    .join(separator);
};
