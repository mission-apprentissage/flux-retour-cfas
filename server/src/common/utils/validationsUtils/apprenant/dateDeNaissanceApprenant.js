import { schema as ISO8601DateSchema } from "../../../domain/date.js";

export const validateDateDeNaissanceApprenant = (value) => {
  return ISO8601DateSchema.validate(value);
};
