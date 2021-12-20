module.exports = {
  async up(db) {
    await db.collection("demandesAcces").rename("demandesIdentifiants", (err) => console.log(err));
  },

  async down(db) {
    await db.collection("demandesIdentifiants").rename("demandesAcces", (err) => console.log(err));
  },
};
