module.exports = {
  async up(db) {
    db.collection("users").updateMany({ apiKey: { $exists: true } }, { $unset: { apiKey: "" } });
  },
};
