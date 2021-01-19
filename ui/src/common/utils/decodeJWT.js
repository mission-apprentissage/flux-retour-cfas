const jwt = require("jsonwebtoken");

export default (access_token) => {
  return {
    access_token,
    ...jwt.decode(access_token),
  };
};
