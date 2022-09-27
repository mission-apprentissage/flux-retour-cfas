const Joi = require("joi");
const { BaseFactory } = require("./baseFactory");
const { schema: anneeScolaireSchema } = require("../../common/domain/anneeScolaire");
const { historiqueSchema: historiqueStatutsSchema } = require("../../common/domain/apprenant/statutApprenant");
const { schema: uaiSchema } = require("../../common/domain/uai");
const { schema: cfdSchema } = require("../../common/domain/cfd");
const { schema: siretSchema } = require("../../common/domain/siret");

class DossierApprenant extends BaseFactory {
  /**
   * Create a DossierApprenant Entry from props
   * @param {*} props
   * @returns
   */
  static create(props) {
    const schema = Joi.object({
      nom_apprenant: Joi.string().required(),
      prenom_apprenant: Joi.string().required(),
      date_de_naissance_apprenant: Joi.date().required(),
      uai_etablissement: uaiSchema.required(),
      nom_etablissement: Joi.string().required(),
      formation_cfd: cfdSchema.required(),
      annee_scolaire: anneeScolaireSchema.required(),
      historique_statut_apprenant: historiqueStatutsSchema.required(),

      ine_apprenant: Joi.string().allow(null, ""),
      id_erp_apprenant: Joi.string().allow(null),
      email_contact: Joi.string().allow(null, ""),
      tel_apprenant: Joi.string().allow(null, ""),
      code_commune_insee_apprenant: Joi.string().allow(null),
      siret_etablissement: siretSchema.allow(null, ""),
      libelle_long_formation: Joi.string().allow(null, ""),
      niveau_formation: Joi.string().allow(null, ""),
      niveau_formation_libelle: Joi.string().allow(null, ""),
      periode_formation: Joi.array().items(Joi.number()).allow(null, ""),

      annee_formation: Joi.number().allow(null),
      formation_rncp: Joi.string().allow(null, ""),

      contrat_date_debut: Joi.date().allow(null),
      contrat_date_fin: Joi.date().allow(null),
      contrat_date_rupture: Joi.date().allow(null),
      source: Joi.string().required(),
      etablissement_reseaux: Joi.array().items(Joi.string()).allow(null, ""),
    });

    const { error } = schema.validate(props);
    if (error) return null;

    return new DossierApprenant({
      ...props,
      nom_apprenant: props.nom_apprenant.toUpperCase().trim(),
      prenom_apprenant: props.prenom_apprenant.toUpperCase().trim(),
      created_at: new Date(),
      updated_at: null,
    });
  }
}

module.exports = { DossierApprenant };
