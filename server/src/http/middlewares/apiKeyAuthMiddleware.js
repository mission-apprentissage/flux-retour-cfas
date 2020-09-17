const config = require("config");

module.exports = (req, res, next) => {
  const apiKey = req.get("API-Key");
  if (!apiKey || apiKey !== config.apiKey) {
    res.status(401).json({ error: "Unauthorized API Key" });
  } else {
    next();
  }
};
