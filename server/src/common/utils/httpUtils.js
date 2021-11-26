const { oleoduc } = require("oleoduc");

module.exports = {
  sendJsonStream: (stream, res) => {
    res.setHeader("Content-Type", "application/json");
    oleoduc(stream, res);
  },
};
