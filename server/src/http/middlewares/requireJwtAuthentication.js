import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import config from "../../config.js";
import { tdbRoles } from "../../common/roles.js";
import { getUserLegacy } from "../../common/actions/legacy/users.legacy.actions.js";
import { findOrganismeByUai } from "../../common/actions/organismes.actions.js";

export default () => {
  const findUserOrCfa = async (usernameOrUai) => {
    const foundUser = await getUserLegacy(usernameOrUai);
    if (foundUser) return foundUser;

    const foundOrganisme = await findOrganismeByUai(usernameOrUai);
    if (foundOrganisme) return { username: usernameOrUai, permissions: [tdbRoles.cfa] };

    return null;
  };

  const jwtStrategyOptions = {
    // JWT can be passed as header
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.auth.user.jwtSecret,
  };

  passport.use(
    "jwtStrategy1",
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

  return passport.authenticate("jwtStrategy1", { session: false });
};
