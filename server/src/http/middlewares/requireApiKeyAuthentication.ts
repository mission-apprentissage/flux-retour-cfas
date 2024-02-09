import * as Sentry from "@sentry/node";
import passport from "passport";
import { Strategy as LocalAPIKeyStrategy } from "passport-localapikey";

export default ({ apiKeyField = "apiKey", apiKeyValue }) => {
  passport.use(
    "apiKeyStrategy",
    new LocalAPIKeyStrategy({ apiKeyField }, async (apikey, done) => {
      try {
        if (apikey === apiKeyValue) {
          return done(null, apikey);
        }
        Sentry.setUser({
          segment: "apiKey",
        });
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  return passport.authenticate("apiKeyStrategy", { session: false, failWithError: true });
};
