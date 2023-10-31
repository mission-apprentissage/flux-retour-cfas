import * as Sentry from "@sentry/node";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

import { getUserLegacy } from "@/common/actions/legacy/users.legacy.actions";
import config from "@/config";

export default () => {
  const jwtStrategyOptions = {
    // JWT can be passed as header
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.auth.user.jwtSecret,
  };

  passport.use(
    "jwtStrategy1",
    new JwtStrategy(jwtStrategyOptions, async (jwt_payload, done) => {
      try {
        const foundUser = await getUserLegacy(jwt_payload.sub);
        if (!foundUser) {
          Sentry.setUser(null);
          return done(null, false);
        }
        Sentry.setUser({
          id: foundUser._id.toString(),
          username: foundUser.username,
          email: foundUser.email ?? "",
          segment: "jwt",
        });
        return done(null, foundUser);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  return passport.authenticate("jwtStrategy1", { session: false });
};
