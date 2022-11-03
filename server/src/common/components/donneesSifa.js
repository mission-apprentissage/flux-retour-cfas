const { DonneeSifaFactory } = require("../factory/donneeSifa.js");
const { DonneesSifaModel } = require("../model");

/**
 * Création d'une donnée SIFA depuis props
 * @param {*} props
 * @returns
 */
const create = async (props) => {
  const entity = DonneeSifaFactory.create(...props);

  if (entity) {
    const saved = await new DonneesSifaModel(entity).save();
    return saved.toObject();
  }

  return null;
};

module.exports = () => ({ create });
