import Joi from "joi";

import { SIRET_REGEX } from "@/common/constants/organisme";

export const schema = Joi.string().length(14).pattern(SIRET_REGEX);

export const validateSiret = (siret) => {
  return schema.required().validate(siret);
};
