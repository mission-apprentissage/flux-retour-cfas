const { UserEventModel } = require("../model");

module.exports = () => ({
  create,
});

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
