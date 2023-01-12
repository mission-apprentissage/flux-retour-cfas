const PASSWORD_MIN_LENGTH = 16;

export const validatePassword = (password) => {
  return Boolean(password) && password.length >= PASSWORD_MIN_LENGTH;
};
