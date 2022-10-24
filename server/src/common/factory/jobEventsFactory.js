const Joi = require("joi");
const { BaseFactory } = require("./baseFactory");

class JobEventsFactory extends BaseFactory {
  /**
   * Crée un JobEvents Entry à partir de props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      jobname: Joi.string().required(),
      action: Joi.string().required(),
      data: Joi.object().allow(null),
    });

    const { error } = schema.validate(props);
    if (error) return null;

    return {
      ...props,
      date: new Date(),
    };
  }
}

module.exports = { JobEventsFactory };
