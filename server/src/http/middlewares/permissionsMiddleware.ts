export default (permissions: any = {}) =>
  (req, res, next) => {
    const { user } = req;
    if (user?.permissions.some((item) => permissions.includes(item))) {
      return next();
    } else {
      return res.status(403).send("Not authorized");
    }
  };
