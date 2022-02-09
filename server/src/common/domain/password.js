const PASSWORD_MIN_LENGTH = 16;

const validatePassword = (password) => {
  return Boolean(password) && password.length >= PASSWORD_MIN_LENGTH;
};

module.exports = {
  validatePassword,
};
