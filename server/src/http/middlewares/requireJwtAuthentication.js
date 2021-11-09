const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const config = require("../../../config");
const { tdbRoles } = require("../../common/roles");

module.exports = ({ users, cfas }) => {
  const findUserOrCfa = async (usernameOrUai) => {
    const foundUser = await users.getUser(usernameOrUai);

    if (foundUser) return foundUser;

    const foundCfa = await cfas.getFromUai(usernameOrUai);

    if (foundCfa) return { username: usernameOrUai, permissions: [tdbRoles.cfa] };

    return null;
  };

  const jwtStrategyOptions = {
    // jwt can be passed as header or query parameter
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromUrlQueryParameter("access_token"),
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ]),
    secretOrKey: config.auth.user.jwtSecret,
  };

  passport.use(
    new JwtStrategy(jwtStrategyOptions, async (jwt_payload, done) => {
      try {
        const foundUser = await findUserOrCfa(jwt_payload.sub);
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
