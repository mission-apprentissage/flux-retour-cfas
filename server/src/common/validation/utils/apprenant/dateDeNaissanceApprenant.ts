import { schema as ISO8601DateSchema } from "@/common/validation/utils/date";

export const validateDateDeNaissanceApprenant = (value) => {
  return ISO8601DateSchema.validate(value);
};
