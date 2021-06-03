const { Schema } = require("mongoose");

module.exports = new Schema(
  {
    created_at: {
      type: Date,
      default: () => new Date(),
    },
    jobType: {
      type: String,
      default: null,
      description: "Le type de job",
    },
    args: {
      type: Object,
      default: null,
      description: "L'action ayant eu lieu",
    },
    commonData: {
      type: Object,
      required: true,
      description: "Les données communes aux doublons",
    },
    duplicatesCount: {
      type: Number,
      required: true,
    },
    duplicatesIds: {
      type: [String],
      required: true,
    },
  },
  { strict: false }
);
