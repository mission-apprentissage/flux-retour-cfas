import config from "../../config.js";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { getUserByEmail } from "../../common/actions/users.actions.js";
import { AuthContext } from "../../common/model/internal/AuthContext.js";
import { getOrganisationById } from "../../common/actions/organisations.actions.js";

export const checkPasswordToken = () => {
  passport.use(
    "jwt-password",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("passwordToken"),
        secretOrKey: config.auth.resetPasswordToken.jwtSecret,
      },
      extractUserFromJWT
    )
  );

  return passport.authenticate("jwt-password", { session: false, failWithError: true });
};

export async function extractUserFromJWT(jwtPayload: any, done: (err?: Error | null, payload?: any) => any) {
  if (Date.now() > jwtPayload.exp * 1000) {
    done(new Error("Unauthorized"), false);
    return;
  }

  try {
    const user = await getUserByEmail(jwtPayload.email);
    if (!user) {
      done(new Error("Unauthorized"), false);
      return;
    }
    (user as unknown as AuthContext).organisation = await getOrganisationById(user.organisation_id);
    done(null, user);
  } catch (err: any) {
    done(err);
  }
}
