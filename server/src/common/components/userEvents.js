const { UserEventModel } = require("../model");

module.exports = () => ({
  create,
  getLastUserEventDate,
});

const getLastUserEventDate = async ({ username, type, action }) => {
  const lastUserEventDate = await UserEventModel.findOne({ username: username, type: type, action: action }).sort({
    date: "desc",
  });
  return lastUserEventDate?.date.toLocaleString("fr-FR");
};

const create = async ({ username, type, action, data }) => {
  const event = new UserEventModel({
    username,
    type,
    action,
    data,
    date: new Date(),
  });
  await event.save();

  return;
};
