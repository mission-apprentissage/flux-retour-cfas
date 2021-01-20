const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const config = require("../../../config");

module.exports = ({ users }) => {
  const jwtStrategyOptions = {
    // jwt can be passed as header or query parameter
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromUrlQueryParameter("access_token"),
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ]),
    secretOrKey: config.auth.user.jwtSecret,
  };

  passport.use(
    new Strategy(jwtStrategyOptions, async (jwt_payload, done) => {
      try {
        const foundUser = await users.getUser(jwt_payload.sub);
        if (!foundUser) {
          return done(null, false);
        }
        return done(null, foundUser);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  return passport.authenticate("jwt", { session: false });
};
