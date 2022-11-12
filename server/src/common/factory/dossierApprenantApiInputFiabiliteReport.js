import Joi from "joi";
import { BaseFactory } from "./baseFactory";

const getPercentage = (count, total) => {
  if (total === 0) return 0;
  return (count * 100) / total;
};

const FIABILITE_FIELDS = [
  "NomApprenant",
  "PrenomApprenant",
  "IneApprenant",
  "DateDeNaissanceApprenant",
  "CodeCommuneInseeApprenant",
  "TelephoneApprenant",
  "EmailApprenant",
  "UaiEtablissement",
  "SiretEtablissement",
];

export class DossierApprenantApiInputFiabiliteReport extends BaseFactory {
  /**
   * Create a DossierApprenantApiInputFiabiliteReport object from props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      analysisId: Joi.string().required(),
      analysisDate: Joi.date().iso().required(),

      totalDossiersApprenants: Joi.number().required(),
      totalUaiEtablissementUniqueFoundInReferentiel: Joi.number().required(),
      totalSiretEtablissementFoundInReferentiel: Joi.number().required(),
      totalUniqueApprenant: Joi.number().required(),
      ...FIABILITE_FIELDS.reduce((acc, fieldName) => {
        return {
          ...acc,
          [`total${fieldName}Present`]: Joi.number().required(),
          [`total${fieldName}FormatValide`]: Joi.number().required(),
        };
      }, {}),
    });

    const { error } = schema.validate(props);
    if (error) throw new Error(error.message);

    return new DossierApprenantApiInputFiabiliteReport({
      ...props,
      ...FIABILITE_FIELDS.reduce((acc, fieldName) => {
        return {
          ...acc,
          [`ratio${fieldName}Present`]: getPercentage(props[`total${fieldName}Present`], props.totalDossiersApprenants),
          [`ratio${fieldName}FormatValide`]: getPercentage(
            props[`total${fieldName}FormatValide`],
            props.totalDossiersApprenants
          ),
        };
      }, {}),
      ratioUaiUniqueFoundInReferentiel: getPercentage(
        props.totalUaiEtablissementUniqueFoundInReferentiel,
        props.totalDossiersApprenants
      ),
      ratioSiretEtablissementFoundInReferentiel: getPercentage(
        props.totalSiretEtablissementFoundInReferentiel,
        props.totalDossiersApprenants
      ),
      ratioUniqueApprenant: getPercentage(props.totalUniqueApprenant, props.totalDossiersApprenants),
      created_at: new Date(),
    });
  }
}
