module.exports = ({ users }) => {
  return async (req, res, next) => {
    const apiKeyRequest = req.get("x-api-key");
    const foundUser = await users.findWithApiKey(apiKeyRequest);

    if (foundUser) {
      req.user = foundUser;
      next();
    } else {
      return res.status(401).send("Not authorized");
    }
  };
};
