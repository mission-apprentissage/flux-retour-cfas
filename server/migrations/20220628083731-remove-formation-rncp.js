module.exports = {
  async up(db) {
    const collection = db.collection("formations");
    await collection.updateMany({}, { $unset: { rncp: "" } });
  },

  async down() {},
};
