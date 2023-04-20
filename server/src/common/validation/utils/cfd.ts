import { CFD_REGEX } from "@/common/constants/organisme.js";
import Joi from "joi";

export const schema = Joi.string().regex(CFD_REGEX);

export const validateCfd = (cfd) => {
  return Boolean(cfd) && CFD_REGEX.test(cfd);
};
