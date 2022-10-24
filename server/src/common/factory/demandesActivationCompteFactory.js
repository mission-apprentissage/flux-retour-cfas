const Joi = require("joi");
const { BaseFactory } = require("./baseFactory");

class DemandesActivationCompteFactory extends BaseFactory {
  /**
   * Crée une demande d'activation de compte entité à partir de props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error } = schema.validate(props);
    if (error) return null;

    return {
      ...props,
      created_at: new Date(),
      updated_at: null,
    };
  }
}

module.exports = { DemandesActivationCompteFactory };
