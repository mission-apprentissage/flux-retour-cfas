const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { CfaModel } = require("../../../common/model");

runScript(async () => {
  const query = { erps: { $size: 0 } };
  const result = await CfaModel.deleteMany(query);
  logger.info(result.deletedCount, "cfas supprimés avec succès");
}, "Remove cfas non branchés");
