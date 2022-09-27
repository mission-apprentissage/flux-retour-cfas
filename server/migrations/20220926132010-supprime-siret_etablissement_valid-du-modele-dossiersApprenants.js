module.exports = {
  async up(db) {
    const collection = db.collection("dossiersApprenants");
    await collection.updateMany({}, { $unset: { siret_etablissement_valid: "" } });
  },
};
