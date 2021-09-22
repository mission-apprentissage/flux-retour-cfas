const { UserEvent } = require("../model");

module.exports = () => ({
  getLastUserEventDate,
  getDataForUai,
  getDataForSiret,
  countDataForUai,
  countDataForSiret,
});

const getLastUserEventDate = async ({ username, type, action }) => {
  const lastUserEventDate = await UserEvent.findOne({ username: username, type: type, action: action }).sort({
    date: "desc",
  });
  return lastUserEventDate?.date.toLocaleString("fr-FR");
};

const getDataForUai = async (uai) => {
  return await UserEvent.find({ "data.uai_etablissement": uai });
};

const countDataForUai = async (uai) => {
  return await UserEvent.countDocuments({ "data.uai_etablissement": uai });
};

const getDataForSiret = async (siret) => {
  return await UserEvent.find({ "data.siret_etablissement": siret });
};

const countDataForSiret = async (siret) => {
  return await UserEvent.countDocuments({ "data.siret_etablissement": siret });
};
