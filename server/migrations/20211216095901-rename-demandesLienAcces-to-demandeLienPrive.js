module.exports = {
  async up(db) {
    await db.collection("demandeLienAcces").rename("demandesLienPrive", (err) => console.log(err));
  },

  async down(db) {
    await db.collection("demandesLienPrive").rename("demandeLienAcces", (err) => console.log(err));
  },
};
