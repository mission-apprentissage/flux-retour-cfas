module.exports = (permissions = {}) => {
  return async (req, res, next) => {
    const { user } = req;
    if (user && user.permissions.some((item) => permissions.includes(item))) {
      next();
    } else {
      return res.status(401).send("Not authorized");
    }
  };
};
