const { MongoClient } = require("mongodb");
const logger = require("./logger");

let mongodbClient;

function ensureInitialization() {
  if (!mongodbClient) {
    throw new Error("Database connection does not exist. Please call connectToMongodb before.");
  }
}

/**
 * @param  {string} uri
 * @returns client
 */
const connectToMongodb = async (uri) => {
  logger.info("Connecting to MongoDB at", uri);
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  mongodbClient = client;

  return client;
};

const closeMongodbConnection = () => {
  ensureInitialization();
  return mongodbClient.close();
};

const getDatabase = () => {
  ensureInitialization();
  return mongodbClient.db();
};

const getDbCollection = (name) => {
  ensureInitialization();
  return mongodbClient.db().collection(name);
};

// const configureValidation = async () => {
//   await ensureInitialization();
//   await Promise.all(
//     getCollectionDescriptors().map(async ({ name, schema }) => {
//       await createCollectionIfNeeded(name);

//       if (!schema) {
//         return;
//       }

//       logger.debug(`Configuring validation for collection ${name}...`);
//       let db = getDatabase();
//       await db.command({
//         collMod: name,
//         validationLevel: "strict",
//         validationAction: "error",
//         validator: {
//           $jsonSchema: schema(),
//         },
//       });
//     })
//   );
// };

module.exports = {
  connectToMongodb,
  closeMongodbConnection,
  getDbCollection,
  getDatabase,
};
