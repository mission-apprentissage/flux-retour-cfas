module.exports = {
  async up(db) {
    const collection = db.collection("cfas");
    await collection.updateMany(
      {},
      {
        $unset: {
          siret_formateur: "",
          siret_responsable: "",
        },
      }
    );
  },

  async down() {},
};
