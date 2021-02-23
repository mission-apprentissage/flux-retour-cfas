const Joi = require("joi");
const { validateCfd } = require("./cfd");
const { buildTokenizedString } = require("../utils/buildTokenizedString");

class Formation {
  constructor(props) {
    Object.entries(props).map(([key, value]) => (this[key] = value));
  }

  static create(props) {
    const schema = Joi.object({
      cfd: Joi.string()
        .custom((value, helpers) => {
          return validateCfd(value) ? value : helpers.error("invalid cfd");
        })
        .required(),
      libelle: Joi.string().allow(""),
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
