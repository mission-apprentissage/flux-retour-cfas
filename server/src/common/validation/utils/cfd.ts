import Joi from "joi";

import { CFD_REGEX } from "@/common/constants/organisme";

export const schema = Joi.string().regex(CFD_REGEX);

export const validateCfd = (cfd) => {
  return Boolean(cfd) && CFD_REGEX.test(cfd);
};
