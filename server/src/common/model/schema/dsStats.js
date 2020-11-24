const { Schema } = require("mongoose");

module.exports = new Schema({
  globalStats: {
    type: Object,
    required: true,
  },
  sendinblueStats: {
    type: Object,
    required: true,
  },
  erpsStats: {
    type: Object,
    required: true,
  },
  locationStats: {
    type: Object,
    required: true,
  },
});
