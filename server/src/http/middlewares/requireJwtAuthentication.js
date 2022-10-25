const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const config = require("../../../config");
const { tdbRoles } = require("../../common/roles");

module.exports = ({ users, partageSimplifieUsers, cfas }) => {
  const findUserOrCfa = async (usernameOrUai) => {
    const foundUser = await users.getUser(usernameOrUai);

    if (foundUser) return foundUser;

    const foundCfa = await cfas.getFromUai(usernameOrUai);

    if (foundCfa) return { username: usernameOrUai, permissions: [tdbRoles.cfa] };

    return null;
  };

  const findPsUser = async (email) => {
    const foundUser = await partageSimplifieUsers.getUser(email);
    if (foundUser) return foundUser;
    return null;
  };

  const jwtStrategyOptions = {
    // JWT can be passed as header
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.auth.user.jwtSecret,
  };

  passport.use(
    new JwtStrategy(jwtStrategyOptions, async (jwt_payload, done) => {
      try {
        const foundUser = await findUserOrCfa(jwt_payload.sub);
        if (!foundUser) {
          const foundPsUser = await findPsUser(jwt_payload.sub);

          if (!foundPsUser) {
            return done(null, false);
          }

          return done(null, foundPsUser);
        }
        return done(null, foundUser);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  return passport.authenticate("jwt", { session: false });
};
