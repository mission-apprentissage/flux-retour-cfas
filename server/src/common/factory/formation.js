const Joi = require("joi");
const { schema: cfdSchema } = require("../domain/cfd");
const { buildTokenizedString } = require("../utils/buildTokenizedString");
const { BaseFactory } = require("./baseFactory");

class Formation extends BaseFactory {
  /**
   * Create a Formation Entry from props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      cfd: cfdSchema.required(),
      cfd_start_date: Joi.date().allow(null),
      cfd_end_date: Joi.date().allow(null),
      rncps: Joi.array().items(Joi.string()),
      libelle: Joi.string().allow("", null),
      niveau: Joi.string().allow(null),
      niveau_libelle: Joi.string().allow(null, ""),
      metiers: Joi.array().items(Joi.string()).allow(null),
    });

    const { error } = schema.validate(props);
    if (error) throw new Error(error.message);

    const tokenized_libelle = buildTokenizedString(props.libelle || "", 3);

    return new Formation({
      ...props,
      tokenized_libelle,
      created_at: new Date(),
      updated_at: null,
    });
  }
}

module.exports = { Formation };
