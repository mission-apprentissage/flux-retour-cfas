/*
  UAI stands for Unité Administrative Immatriculée, a code used in the
  Répertoire National des Etablissements (RNE) to identify collèges, lycées, CFA...
*/
import Joi from "joi";

const UAI_REGEX = /^[0-9_]{7}[a-zA-Z]{1}$/;

export const schema = Joi.string().length(8).regex(UAI_REGEX);

export const validateUai = (uai) => {
  return schema.required().validate(uai);
};

export const getDepartementCodeFromUai = (uai) => {
  if (validateUai(uai).error) throw new Error("invalid uai passed");
  const code = uai.slice(0, 3);
  return Number(code) < 10 ? `0${Number(code)}` : Number(code).toString();
};
