const siretRegex = /^[0-9]{14}$/;

const validateSiret = (siret) => {
  return Boolean(siret) && siretRegex.test(siret);
};

module.exports = {
  validateSiret,
  siretRegex,
};
