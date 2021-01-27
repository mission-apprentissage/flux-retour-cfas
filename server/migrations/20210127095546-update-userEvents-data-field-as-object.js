const logger = require("../src/common/logger");

module.exports = {
  async up(db) {
    const collection = db.collection("userEvents");

    // Update data field for Ymag -> from string to object
    const cursor = collection.find({ data: { $exists: true }, $and: [{ username: "ymag" }] });

    while (await cursor.hasNext()) {
      const document = await cursor.next();

      try {
        const dataAsObject = JSON.parse(document.data);
        await collection.findOneAndUpdate({ _id: document._id }, { $set: { data: dataAsObject } });
      } catch (err) {
        logger.error(`JSON Parsing error for data for userEvent id ${document._id}`);
      }
    }
  },
  async down(db) {
    const collection = db.collection("statutsCandidats");

    // Update data field for Ymag -> from object to string
    const cursor = collection.find({ data: { $exists: true }, $and: [{ username: "ymag" }] });

    while (await cursor.hasNext()) {
      const document = await cursor.next();

      try {
        const dataAsString = JSON.stringify(document.data);
        await collection.findOneAndUpdate({ _id: document._id }, { $set: { data: dataAsString } });
      } catch (err) {
        logger.error(`JSON Stringify error for data for userEvent id ${document._id}`);
      }
    }
  },
};
