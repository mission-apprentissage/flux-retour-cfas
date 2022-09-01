const { validateSiret } = require("../src/common/domain/siret");

module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    const cursor = collection.find();
    while (await cursor.hasNext()) {
      const document = await cursor.next();

      const isSiretValid = !validateSiret(document.siret_etablissement).error;
      await collection.findOneAndUpdate({ _id: document._id }, { $set: { siret_etablissement_valid: isSiretValid } });
    }
  },

  async down(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { siret_etablissement_valid: "" } });
  },
};
