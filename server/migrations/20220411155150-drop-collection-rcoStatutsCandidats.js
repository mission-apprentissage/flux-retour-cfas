module.exports = {
  async up(db) {
    db.collection("rcoStatutsCandidats").drop();
  },

  async down() {},
};
