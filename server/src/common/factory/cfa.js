import { buildTokenizedString } from "../utils/buildTokenizedString.js";
import Joi from "joi";
import { schema as uaiSchema } from "../domain/uai.js";
import { schema as natureSchema } from "../domain/organisme-de-formation/nature.js";
import config from "../../../config.js";
import { generateRandomAlphanumericPhrase } from "../utils/miscUtils.js";
import { BaseFactory } from "./baseFactory.js";

const TOKENIZED_STRING_SIZE = 4;

export class Cfa extends BaseFactory {
  /**
   * Create a Cfa Entry from props
   * Generate a random accessToken and privateUrl
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      uai: uaiSchema.required(),
      sirets: Joi.array().items(Joi.string()).allow(null),
      nom: Joi.string().allow("").required(),
      nature: natureSchema,
      natureValidityWarning: Joi.boolean(),
      adresse: Joi.string().allow("", null),
      erps: Joi.array().items(Joi.string()).allow(null),
      region_nom: Joi.string().allow("", null),
      region_num: Joi.string().allow("", null),
      metiers: Joi.array().items(Joi.string()).allow(null),
      first_transmission_date: Joi.date(),
    });

    const { error } = schema.validate(props);
    if (error) return null;

    const accessToken = generateRandomAlphanumericPhrase();

    return new Cfa({
      ...props,
      access_token: accessToken,
      nom_tokenized: this.createTokenizedNom(props.nom),
      private_url: `${config.publicUrl}/cfa/${accessToken}`,
      created_at: new Date(),
      updated_at: null,
    });
  }

  static createTokenizedNom(nom) {
    return buildTokenizedString(nom.trim(), TOKENIZED_STRING_SIZE);
  }
}
