const { DemandeIdentifiantsModel } = require("../model");

const create = async (props) => {
  const { profil, region, email } = props;

  const newDemandeIdentifiants = new DemandeIdentifiantsModel({
    profil,
    region,
    email,
    created_at: new Date(),
  });

  await newDemandeIdentifiants.save();
  return;
};

module.exports = () => ({
  create,
});
