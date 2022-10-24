const { UserEventModel, UserModel } = require("../model");
const { USER_EVENTS_ACTIONS } = require("../../common/constants/userEventsConstants");

module.exports = () => ({
  create,
  getUploadHistoryList,
});

const create = async ({ username, type, action, data }) => {
  const user = await UserModel.findOne({ username }).lean();
  const UNKNOWN_DEFAULT_VALUE = "NC";

  await new UserEventModel({
    username,
    user_organisme: user?.organisme ?? UNKNOWN_DEFAULT_VALUE,
    user_region: user?.region ?? UNKNOWN_DEFAULT_VALUE,
    user_network: user?.network ?? UNKNOWN_DEFAULT_VALUE,
    type,
    action,
    data,
    date: new Date(),
  }).save();

  return;
};

/**
 * Récupération de l'historique des téléversements pour un mail utilisateur
 * @param {*} param0
 * @returns
 */
const getUploadHistoryList = async ({ username }) => {
  const userEventsUploadSuccessForUserMail = await UserEventModel.aggregate([
    {
      $match: {
        username: username,
        action: USER_EVENTS_ACTIONS.UPLOAD.SUCCESS,
        "data.originalname": { $exists: true },
      },
    },
    { $project: { "data.originalname": 1, date: 1 } },
    { $sort: { date: -1 } },
  ]);

  return userEventsUploadSuccessForUserMail.map((item) => ({
    nom_fichier: item.data.originalname,
    date_creation: item.date,
  }));
};
