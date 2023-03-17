import Joi from "joi";

/**
 * Create a DossierApprenantApiInputFiabilite object from props
 * @param {*} props
 * @returns
 */
export const createDossierApprenantApiInputFiabilite = (props) => {
  const schema = Joi.object({
    // analysis information
    analysisId: Joi.string().required(),
    analysisDate: Joi.date().iso().required(),
    // original data
    originalData: Joi.object().required(),
    erp: Joi.string().required(),
    sentOnDate: Joi.date().required(),

    // dossier apprenant fields fiabilité
    nomApprenantPresent: Joi.boolean().required(),
    nomApprenantFormatValide: Joi.boolean().required(),
    prenomApprenantPresent: Joi.boolean().required(),
    prenomApprenantFormatValide: Joi.boolean().required(),
    ineApprenantPresent: Joi.boolean().required(),
    ineApprenantFormatValide: Joi.boolean().required(),
    uniqueApprenant: Joi.boolean().required(),
    dateDeNaissanceApprenantPresent: Joi.boolean().required(),
    dateDeNaissanceApprenantFormatValide: Joi.boolean().required(),
    codeCommuneInseeApprenantPresent: Joi.boolean().required(),
    codeCommuneInseeApprenantFormatValide: Joi.boolean().required(),
    telephoneApprenantPresent: Joi.boolean().required(),
    telephoneApprenantFormatValide: Joi.boolean().required(),
    emailApprenantPresent: Joi.boolean().required(),
    emailApprenantFormatValide: Joi.boolean().required(),
    uaiEtablissementPresent: Joi.boolean().required(),
    uaiEtablissementFormatValide: Joi.boolean().required(),
    uaiEtablissementUniqueFoundInReferentiel: Joi.boolean().required(),
    siretEtablissementPresent: Joi.boolean().required(),
    siretEtablissementFormatValide: Joi.boolean().required(),
    siretEtablissementFoundInReferentiel: Joi.boolean().required(),
  });

  const { error } = schema.validate(props);
  if (error) throw new Error(error.message);

  return {
    ...props,
    createdAt: new Date(),
  };
};
