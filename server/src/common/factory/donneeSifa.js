const { BaseFactory } = require("./baseFactory");
const { DonneesSifaModel } = require("../model/index.js");
const { getRandomIne } = require("../domain/apprenant/ineApprenant.js");
const { schema: donneeSifaSchema } = require("../domain/donneeSifa.js");

class DonneeSifaFactory extends BaseFactory {
  /**
   * Create a DonneeSifa Entry from props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schemaErrors = donneeSifaSchema.validate(props)?.error;
    const isValid = !schemaErrors; // Todo return errors too

    const cleanedNom = typeof props.nom_apprenant === "string" ? props.nom_apprenant?.toUpperCase().trim() : null;
    const cleanedPrenom =
      typeof props.prenom_apprenant === "string" ? props.prenom_apprenant?.toUpperCase().trim() : null;

    return new DonneesSifaModel({
      ...props,
      ine_apprenant: getRandomIne(),
      nom_apprenant: cleanedNom,
      prenom_apprenant: cleanedPrenom,
      is_valid: isValid,
      created_at: new Date(),
      updated_at: null,
    });
  }
}

module.exports = { DonneeSifaFactory };
