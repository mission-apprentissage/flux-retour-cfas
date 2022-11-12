import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import config from "../../../config/index.js";
import { tdbRoles } from "../../common/roles.js";

export default ({ users, cfas }) => {
  const findUserOrCfa = async (usernameOrUai) => {
    const foundUser = await users.getUser(usernameOrUai);

    if (foundUser) return foundUser;

    const foundCfa = await cfas.getFromUai(usernameOrUai);

    if (foundCfa) return { username: usernameOrUai, permissions: [tdbRoles.cfa] };

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
