const { ListReseauxModel } = require("../model");

const create = async ({ network }) => {
  const saved = await new ListReseauxModel({
    network,
  }).save();

  return saved.toObject();
};

module.exports = () => ({
  getAll: async () => {
    return await ListReseauxModel.find().lean();
  },
  create,
});
