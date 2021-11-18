const { DemandeAccesModel } = require("../model");

const create = async (props) => {
  const { profil, region, email } = props;

  const newDemandeAcces = new DemandeAccesModel({
    profil,
    region,
    email,
    created_at: new Date(),
  });

  await newDemandeAcces.save();
  return;
};

module.exports = () => ({
  create,
});
