import passport from "passport";
import { Strategy as BearerStrategy } from "passport-http-bearer";

import { getOrganismeByAPIKey } from "@/common/actions/organismes/organismes.actions";

export default () => {
  passport.use(
    "bearerStrategy",
    new BearerStrategy(async (token, done) => {
      try {
        const foundOrganisme = await getOrganismeByAPIKey(token);
        if (!foundOrganisme) {
          return done(null, false);
        }
        return done(null, foundOrganisme);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  return passport.authenticate("bearerStrategy", { session: false });
};
