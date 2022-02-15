module.exports = {
  async up(db) {
    db.collection("bcnformationdiplomes").drop();
    db.collection("bcnlettrespecialites").drop();
    db.collection("bcnndispositifformations").drop();
    db.collection("bcnnmefs").drop();
    db.collection("bcnnniveauformationdiplomes").drop();
  },

  async down() {},
};
