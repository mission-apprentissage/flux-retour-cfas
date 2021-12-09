module.exports = {
  async up(db) {
    db.collection("stats").drop();
  },

  async down() {},
};
