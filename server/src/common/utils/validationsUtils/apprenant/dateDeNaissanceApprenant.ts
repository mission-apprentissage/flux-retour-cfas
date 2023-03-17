import { schema as ISO8601DateSchema } from "../../../utils/validationsUtils/date.js";

export const validateDateDeNaissanceApprenant = (value) => {
  return ISO8601DateSchema.validate(value);
};
