const validateCfd = (cfd) => {
  return Boolean(cfd) && /^[a-zA-Z0-9_]{8}$/.test(cfd);
};

module.exports = {
  validateCfd,
};
