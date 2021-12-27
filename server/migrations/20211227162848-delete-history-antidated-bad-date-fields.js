module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { history_antidated: "", history_with_bad_date: "" } });
  },

  async down() {},
};
