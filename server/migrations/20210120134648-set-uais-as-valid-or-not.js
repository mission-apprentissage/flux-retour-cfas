const { validateUai } = require("../src/common/domain/uai");

module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    const cursor = collection.find();
    while (await cursor.hasNext()) {
      const document = await cursor.next();

      const isUaiValid = !validateUai(document.uai_etablissement).error;
      await collection.findOneAndUpdate({ _id: document._id }, { $set: { uai_etablissement_valid: isUaiValid } });
    }
  },

  async down(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { uai_etablissement_valid: "" } });
  },
};
