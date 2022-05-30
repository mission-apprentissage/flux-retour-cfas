const Joi = require("joi");
const { validateCfd } = require("../domain/cfd");
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
      cfd: Joi.string()
        .custom((value, helpers) => {
          return validateCfd(value) ? value : helpers.error("invalid cfd");
        })
        .required(),
      cfd_start_date: Joi.date(),
      cfd_end_date: Joi.date(),
      rncp: Joi.string().allow(null),
      libelle: Joi.string().allow(""),
      niveau: Joi.string().allow(null),
      niveau_libelle: Joi.string().allow(null, ""),
      metiers: Joi.array().items(Joi.string().allow(null, "")).allow(null),
    });

    const { error } = schema.validate(props);
    if (error) return null;

    const tokenized_libelle = buildTokenizedString(props.libelle, 3);

    return new Formation({
      ...props,
      tokenized_libelle,
      created_at: new Date(),
      updated_at: null,
    });
  }
}

module.exports = { Formation };
