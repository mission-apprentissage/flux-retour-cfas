const { JobEventModel } = require("../model");

module.exports = () => ({ isJobInAction });

const isJobInAction = async (jobname, action) => {
  const lastJobEvent = await JobEventModel.findOne({ jobname: jobname }).sort({ date: "desc" });
  return lastJobEvent?.action === action ?? false;
};
