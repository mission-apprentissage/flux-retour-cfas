const apiKeyAuthMiddleware = require("./apiKeyAuthMiddleware");
const jwtAuthMiddleware = require("./jwtAuthMiddleware");

module.exports = ({ users }) => (req, res, next) => {
  if (req.get("x-api-key")) {
    return apiKeyAuthMiddleware({ users })(req, res, next);
  }
  return jwtAuthMiddleware({ users })(req, res, next);
};
