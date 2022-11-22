import { uaiSchema } from "./validationUtils.js";

export const getDepartementCodeFromUai = (uai) => {
  if (uaiSchema.required().validate(uai).error) throw new Error("invalid uai passed");
  const code = uai.slice(0, 3);
  return Number(code) < 10 ? `0${Number(code)}` : Number(code).toString();
};
