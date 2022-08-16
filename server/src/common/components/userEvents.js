const { UserEventModel, UserModel } = require("../model");

module.exports = () => ({
  create,
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
