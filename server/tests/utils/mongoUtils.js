const { mongooseInstance } = require("../../src/common/mongodb");

const clearAllCollections = async () => {
  const collections = mongooseInstance.connection.collections;

  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany({});
    })
  );
};

module.exports = {
  clearAllCollections,
};
