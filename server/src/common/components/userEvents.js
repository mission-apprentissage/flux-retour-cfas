const { UserEventModel, UserModel } = require("../model");

module.exports = () => ({
  create,
});

const create = async ({ username, type, action, data }) => {
  const user = await UserModel.findOne({ username }).lean();

  const event = new UserEventModel({
    username,
    user_organisme: user?.organisme ?? null,
    user_region: user?.region ?? null,
    user_network: user?.network ?? null,
    type,
    action,
    data,
    date: new Date(),
  });
  await event.save();

  return;
};
