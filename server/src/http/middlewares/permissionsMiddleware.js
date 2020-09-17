const { isEqual, pick } = require("lodash");

module.exports = (permissions = {}) => {
  return (req, res, next) => {
    const current = pick(req.user, Object.keys(permissions));
    if (isEqual(current, permissions)) {
      next();
    } else {
      return res.status(401).send("Not authorized");
    }
  };
};
