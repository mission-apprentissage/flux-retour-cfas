const mongoose = require("mongoose");
const config = require("../../config");
const logger = require("./logger");

const mongooseInstance = mongoose;

module.exports.connectToMongo = (mongoUri = config.mongodb.uri) => {
  return new Promise((resolve, reject) => {
    logger.info(`MongoDB: Connection to ${mongoUri}`);

    // Set up default mongoose connection
    mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      autoIndex: false, // otherwise Mongoose will build indexes everytime the application starts up
    });

    // Get Mongoose to use the global promise library
    mongoose.Promise = global.Promise; // Get the default connection
    const db = mongoose.connection;

    // Bind connection to error event (to get notification of connection errors)
    db.on("error", (e) => {
      logger.error.bind(logger, "MongoDB: connection error:");
      reject(e);
    });

    db.once("open", () => {
      logger.info("MongoDB: Connected");
      resolve({ db });
    });
  });
};

module.exports.closeMongoConnection = async () => {
  return await mongoose.disconnect();
};

module.exports.mongooseInstance = mongooseInstance;
