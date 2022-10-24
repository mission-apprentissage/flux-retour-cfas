const Joi = require("joi");
const { BaseFactory } = require("./baseFactory");

class UserEventsFactory extends BaseFactory {
  /**
   * Crée un UserEvent Entry à partir de props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      user_email: Joi.string().required(),
      type: Joi.string().required(),
      action: Joi.string(),
      data: Joi.object().allow(null),
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

module.exports = { UserEventsFactory };
