module.exports = {
  async up(db) {
    const collection = db.collection("cfas");

    await collection.updateMany({}, { $rename: { url_access_token: "access_token" } });
  },
  async down(db) {
    const collection = db.collection("cfas");

    await collection.updateMany({}, { $rename: { access_token: "url_access_token" } });
  },
};
