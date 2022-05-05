module.exports = {
  async up(db) {
    db.collection("formations").updateMany({ rncp: { $exists: false } }, { $set: { rncp: "" } });
  },

  async down() {},
};
