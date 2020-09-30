const config = require("config");

module.exports = (req, res, next) => {
  const apiKey = req.get("x-api-key");
  if (!apiKey || apiKey !== config.apiKey) {
    res.status(401).json({ error: "Unauthorized API Key" });
  } else {
    next();
  }
};
