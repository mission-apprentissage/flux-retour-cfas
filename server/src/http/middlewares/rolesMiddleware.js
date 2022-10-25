module.exports =
  (role = {}) =>
  (req, res, next) => {
    const { user } = req;
    if (user && user.role === role) {
      next();
    } else {
      return res.status(403).send("Not authorized");
    }
  };
