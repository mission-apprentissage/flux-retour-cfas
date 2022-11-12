import { MongoClient } from "mongodb";
import logger from "./logger";

let mongodbClient;

const ensureInitialization = () => {
  if (!mongodbClient) {
    throw new Error("Database connection does not exist. Please call connectToMongodb before.");
  }
};

/**
 * @param  {string} uri
 * @returns client
 */
export const connectToMongodb = async (uri) => {
  logger.info("Connecting to MongoDB at", uri);
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  mongodbClient = client;

  return client;
};

export const closeMongodbConnection = () => {
  ensureInitialization();
  return mongodbClient.close();
};

export const getDatabase = () => {
  ensureInitialization();
  return mongodbClient.db();
};

export const getDbCollection = (name) => {
  ensureInitialization();
  return mongodbClient.db().collection(name);
};

export const getDbCollectionIndexes = async (name) => {
  ensureInitialization();
  return await mongodbClient.db().collection(name).indexes();
};

// export const configureValidation = async () => {
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
