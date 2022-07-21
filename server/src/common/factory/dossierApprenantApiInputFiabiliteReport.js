const Joi = require("joi");
const { BaseFactory } = require("./baseFactory");

const getPercentage = (count, total) => {
  if (total === 0) return 0;
  return (count * 100) / total;
};

class DossierApprenantApiInputFiabiliteReport extends BaseFactory {
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
      totalNomApprenantPresent: Joi.number().required(),
      totalNomApprenantFormatValide: Joi.number().required(),
      totalPrenomApprenantPresent: Joi.number().required(),
      totalPrenomApprenantFormatValide: Joi.number().required(),
      totalIneApprenantPresent: Joi.number().required(),
      totalIneApprenantFormatValide: Joi.number().required(),
    });

    const { error } = schema.validate(props);
    if (error) throw new Error(error.message);

    return new DossierApprenantApiInputFiabiliteReport({
      ...props,
      created_at: new Date(),
      ratioNomApprenantPresent: getPercentage(props.totalNomApprenantPresent, props.totalDossiersApprenants),
      ratioNomApprenantFormatValide: getPercentage(props.totalNomApprenantFormatValide, props.totalDossiersApprenants),
      ratioPrenomApprenantPresent: getPercentage(props.totalPrenomApprenantPresent, props.totalDossiersApprenants),
      ratioPrenomApprenantFormatValide: getPercentage(
        props.totalPrenomApprenantFormatValide,
        props.totalDossiersApprenants
      ),
      ratioIneApprenantPresent: getPercentage(props.totalIneApprenantPresent, props.totalDossiersApprenants),
      ratioIneApprenantFormatValide: getPercentage(props.totalIneApprenantFormatValide, props.totalDossiersApprenants),
    });
  }
}

module.exports = { DossierApprenantApiInputFiabiliteReport };
