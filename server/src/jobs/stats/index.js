const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { SampleEntity } = require("../../common/model");

runScript(async ({ db }) => {
  const nbSampleEntities = await SampleEntity.countDocuments({});
  logger.info(`Db ${db.name} - SampleEntities count : ${nbSampleEntities}`);
});
