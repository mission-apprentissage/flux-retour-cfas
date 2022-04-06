module.exports = {
  async up(db) {
    db.collection("cfaDataFeedback").drop();
  },

  async down() {},
};
