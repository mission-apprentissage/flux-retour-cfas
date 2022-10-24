const { DemandesActivationCompteFactory } = require("../factory/demandesActivationCompteFactory.js");
const { PartageSimplifieDemandeActivationCompteModel } = require("../model/index.js");

/**
 * Création d'une demande d'activation de compte
 * @param {*} param0
 * @returns
 */
const createDemandeActivationCompte = async (email) => {
  const entity = DemandesActivationCompteFactory.create({ email });
  if (entity === null) return null;

  const saved = await new PartageSimplifieDemandeActivationCompteModel(entity).save();
  return saved.toObject();
};

module.exports = () => ({
  createDemandeActivationCompte,
});
