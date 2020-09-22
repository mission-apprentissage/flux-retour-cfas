const { some } = require("lodash");

module.exports = (permissions = {}) => {
  return async (req, res, next) => {
    const { user } = req;
    if (user && some(user.permissions, (item) => permissions.includes(item))) {
      next();
    } else {
      return res.status(401).send("Not authorized");
    }
  };
};
