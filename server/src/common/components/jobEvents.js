const { jobEventsDb } = require("../model/collections");

module.exports = () => ({ isJobInAction });

const isJobInAction = async (jobname, action) => {
  const [lastJobEvent] = await jobEventsDb().find({ jobname }).limit(1).sort({ date: "desc" }).toArray();

  if (!lastJobEvent) return false;
  return lastJobEvent.action === action;
};
