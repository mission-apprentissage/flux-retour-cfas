module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    const cursor = collection.find();
    while (await cursor.hasNext()) {
      const document = await cursor.next();
      await collection.findOneAndUpdate(
        { _id: document._id },
        {
          $set: {
            prenom_apprenant: document.prenom_apprenant.toUpperCase(),
            nom_apprenant: document.nom_apprenant.toUpperCase(),
          },
        }
      );
    }
  },

  async down() {},
};
