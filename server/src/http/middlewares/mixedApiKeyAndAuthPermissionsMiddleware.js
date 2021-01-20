const { User } = require("../../common/model/index");
const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const config = require("../../../config");

module.exports = (users, permissions = {}) => {
  passport.use(
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromUrlQueryParameter("access_token"),
          ExtractJwt.fromAuthHeaderAsBearerToken(),
        ]),
        secretOrKey: config.auth.user.jwtSecret,
      },
      (jwt_payload, done) => {
        return users
          .getUser(jwt_payload.sub)
          .then((user) => {
            if (!user) {
              return done(null, false);
            }
            return done(null, user);
          })
          .catch((err) => done(err));
      }
    )
  );

  return async (req, res, next) => {
    const apiKeyRequest = req.get("x-api-key");

    if (!apiKeyRequest) {
      passport.authenticate("jwt", { session: false }, function (err, user) {
        if (err) {
          next(err);
        }
        if (!user) {
          return res.status(401).send("Not authorized");
        }
        if (user && user.permissions.some((item) => permissions.includes(item))) {
          next();
        } else {
          return res.status(401).send("Not authorized");
        }
      })(req, res, next);
    } else {
      const userForApiKey = await User.findOne({ apiKey: `${apiKeyRequest}` });
      if (userForApiKey && userForApiKey.permissions.some((item) => permissions.includes(item))) {
        req.user = userForApiKey;
        next();
      } else {
        return res.status(401).send("Not authorized");
      }
    }
  };
};
