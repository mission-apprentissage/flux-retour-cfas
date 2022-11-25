import Joi from "joi";

export const NATURE_ORGANISME_DE_FORMATION = {
  RESPONSABLE: "responsable",
  FORMATEUR: "formateur",
  RESPONSABLE_FORMATEUR: "responsable_formateur",
  INCONNUE: "inconnue",
};

export const schema = Joi.string().valid(...Object.values(NATURE_ORGANISME_DE_FORMATION));

export const validateNatureOrganismeDeFormation = (value) => {
  return schema.validate(value);
};
