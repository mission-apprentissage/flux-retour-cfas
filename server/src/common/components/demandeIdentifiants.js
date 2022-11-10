const { demandesIdentifiantsDb } = require("../model/collections");

const create = async (props) => {
  const { profil, region, email } = props;

  await demandesIdentifiantsDb().insertOne({
    profil,
    region,
    email,
    created_at: new Date(),
  });
};

module.exports = () => ({
  create,
});
