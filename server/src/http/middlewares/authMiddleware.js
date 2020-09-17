const config = require("config");
const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const compose = require("compose-middleware").compose;

module.exports = ({ users }) => {
  passport.use(
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromUrlQueryParameter("token"),
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

  return compose([
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      next();
    },
  ]);
};
