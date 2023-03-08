export default (permissions = {}) =>
  (req, res, next) => {
    const { user } = req;
    if (user?.permissions.some((item) => permissions.includes(item))) {
      next();
    } else {
      return res.status(403).send("Not authorized");
    }
  };
