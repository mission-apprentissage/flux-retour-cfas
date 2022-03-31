const { buildTokenizedString } = require("../utils/buildTokenizedString");
const Joi = require("joi");
const { validateUai } = require("./uai");
const config = require("../../../config");
const { generateRandomAlphanumericPhrase } = require("../utils/miscUtils");

const TOKENIZED_STRING_SIZE = 4;

class Cfa {
  constructor(props) {
    Object.entries(props).map(([key, value]) => (this[key] = value));
  }

  /**
   * Create a Cfa Entry from props
   * Generate a random accessToken and privateUrl
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      uai: Joi.string()
        .custom((value, helpers) => {
          return validateUai(value) ? value : helpers.error("invalid uai");
        })
        .required(),
      sirets: Joi.array().items(Joi.string()).allow(null),
      nom: Joi.string().allow("").required(),
      adresse: Joi.string().allow("", null),
      erps: Joi.array().items(Joi.string()).allow(null),
      region_nom: Joi.string().allow(""),
      region_num: Joi.string().allow(""),
      first_transmission_date: Joi.date(),
    });

    const { error } = schema.validate(props);
    if (error) return null;

    const accessToken = generateRandomAlphanumericPhrase();

    return new Cfa({
      ...props,
      accessToken,
      nom_tokenized: this.createTokenizedNom(props.nom),
      private_url: `${config.publicUrl}/cfas/${accessToken}`,
      created_at: new Date(),
      updated_at: null,
    });
  }

  static createTokenizedNom(nom) {
    return buildTokenizedString(nom.trim(), TOKENIZED_STRING_SIZE);
  }
}

module.exports = { Cfa };
