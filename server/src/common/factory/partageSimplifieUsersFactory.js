const Joi = require("joi");
const { BaseFactory } = require("./baseFactory");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../common/roles.js");
const { schema: uaiSchema } = require("../../common/domain/uai");
const { schema: siretSchema } = require("../../common/domain/siret");
const { schema: passwordSchema } = require("../../common/domain/password.js");

class PartageSimplifieUsersFactory extends BaseFactory {
  /**
   * Crée une entité User à partir de props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: passwordSchema.required(),
      role: Joi.string()
        .valid(...Object.values(PARTAGE_SIMPLIFIE_ROLES))
        .required(),
      uai: uaiSchema.allow("", null),
      siret: siretSchema.allow("", null),
      nom: Joi.string().allow("", null),
      prenom: Joi.string().allow("", null),
      fonction: Joi.string().allow("", null),
      telephone: Joi.string().allow("", null),
      region: Joi.string().allow("", null),
      outils_gestion: Joi.array().items(Joi.string()).allow(null),
      nom_etablissement: Joi.string().allow("", null),
      adresse_etablissement: Joi.string().allow("", null),
    });

    const { error } = schema.validate(props);

    if (error) {
      throw new Error(`Can't create user, schema not valid : ${error}`);
    }

    return {
      ...props,
      created_at: new Date(),
      updated_at: null,
    };
  }
}

module.exports = { PartageSimplifieUsersFactory };
