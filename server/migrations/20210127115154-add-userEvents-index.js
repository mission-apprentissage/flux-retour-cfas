module.exports = {
  async up(db) {
    const collection = db.collection("userEvents");

    await collection.createIndex({ username: 1 }, { name: "username" });
  },

  async down(db) {
    const collection = db.collection("userEvents");

    await collection.dropIndex({ name: "username" });
  },
};
