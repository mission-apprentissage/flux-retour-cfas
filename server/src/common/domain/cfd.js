const validateCfd = (cfd) => {
  return Boolean(cfd) && cfdRegex.test(cfd);
};

const cfdRegex = /^[a-zA-Z0-9_]{8}$/;

module.exports = {
  validateCfd,
  cfdRegex,
};
