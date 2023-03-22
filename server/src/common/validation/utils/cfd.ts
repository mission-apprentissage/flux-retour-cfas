import Joi from "joi";

export const cfdRegex = /^[a-zA-Z0-9_]{8}$/;
export const schema = Joi.string().regex(cfdRegex);

export const validateCfd = (cfd) => {
  return Boolean(cfd) && cfdRegex.test(cfd);
};
