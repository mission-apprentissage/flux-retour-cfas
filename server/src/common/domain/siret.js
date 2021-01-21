const validateSiret = (siret) => {
  return Boolean(siret) && /^[0-9]{14}$/.test(siret);
};

module.exports = {
  validateSiret,
};
