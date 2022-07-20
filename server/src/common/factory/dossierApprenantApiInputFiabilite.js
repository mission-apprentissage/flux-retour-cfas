const Joi = require("joi");
const { BaseFactory } = require("./baseFactory");

class DossierApprenantApiInputFiabilite extends BaseFactory {
  /**
   * Create a DossierApprenantApiInputFiabilite object from props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      // analysis information
      analysisId: Joi.string().required(),
      analysisTimestamp: Joi.number().required(),
      // original data
      originalData: Joi.object().required(),
      erp: Joi.string().required(),
      sentOnDate: Joi.date().required(),

      // dossier apprenant fields fiabilité
      nomApprenantPresent: Joi.boolean().required(),
      nomApprenantFormatValide: Joi.boolean().required(),
      prenomApprenantPresent: Joi.boolean().required(),
      prenomApprenantFormatValide: Joi.boolean().required(),
    });

    const { error } = schema.validate(props);
    if (error) return null;

    return new DossierApprenantApiInputFiabilite({
      ...props,
      createdAt: new Date(),
    });
  }
}

module.exports = { DossierApprenantApiInputFiabilite };
