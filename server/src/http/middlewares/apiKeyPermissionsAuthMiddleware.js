const { some } = require("lodash");
const { User } = require("../../common/model/index");

module.exports = (permissions = {}) => {
  return async (req, res, next) => {
    const apiKeyRequest = req.get("x-api-key");

    if (!apiKeyRequest) {
      return res.status(401).send("No API Key Found");
    }

    const userForApiKey = await User.findOne({ apiKey: `${apiKeyRequest}` });
    if (userForApiKey && some(userForApiKey.permissions, (item) => permissions.includes(item))) {
      req.user = userForApiKey;
      next();
    } else {
      return res.status(401).send("Not authorized");
    }
  };
};
