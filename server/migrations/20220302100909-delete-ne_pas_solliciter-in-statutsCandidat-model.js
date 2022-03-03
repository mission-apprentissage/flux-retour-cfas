module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { ne_pas_solliciter: "" } });
  },

  async down() {},
};
