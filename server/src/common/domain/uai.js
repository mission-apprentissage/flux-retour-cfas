/*
  UAI stands for Unité Administrative Immatriculée, a code used in the
  Répertoire National des Etablissements (RNE) to identify collèges, lycées, CFA...
*/
const Joi = require("joi");
const uaiRegex = /^[0-9_]{7}[a-zA-Z]{1}$/;
const validateUai = (uai) => Boolean(uai) && uaiRegex.test(uai);

const getDepartementCodeFromUai = (uai) => {
  if (!validateUai(uai)) throw new Error("invalid uai passed");
  const code = uai.slice(0, 3);
  return Number(code) < 10 ? `0${Number(code)}` : Number(code).toString();
};

const schema = Joi.string().regex(uaiRegex);

module.exports = {
  validateUai,
  schema,
  uaiRegex,
  getDepartementCodeFromUai,
};
