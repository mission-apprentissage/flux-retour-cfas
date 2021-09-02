const Joi = require("joi");
const config = require("../../../../config");

const logger = require("../../logger");
const { schema: anneeScolaireSchema } = require("../../domain/anneeScolaire");

// parse date as DD/MM/YYYY
const parseGestiDate = (gestiDate) => {
  const [day, month, year] = gestiDate.split("/");
  return new Date(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
};

const adaptGestiStatutCandidat = (gestiStatutCandidat) => {
  return {
    ine_apprenant: gestiStatutCandidat.ine_apprenant,
    nom_apprenant: gestiStatutCandidat.nom_apprenant,
    prenom_apprenant: gestiStatutCandidat.prenom_apprenant,
    prenom2_apprenant: gestiStatutCandidat.prenom2_apprenant,
    prenom3_apprenant: gestiStatutCandidat.prenom3_apprenant,
    email_contact: gestiStatutCandidat.email_contact,
    libelle_court_formation: gestiStatutCandidat.libelle_court_formation,
    libelle_long_formation: gestiStatutCandidat.libelle_long_formation,
    uai_etablissement: gestiStatutCandidat.uai_etablissement,
    nom_etablissement: gestiStatutCandidat.nom_etablissement,
    ne_pas_solliciter: gestiStatutCandidat.ne_pas_solliciter === "true",
    statut_apprenant: gestiStatutCandidat.statut_apprenant && Number(gestiStatutCandidat.statut_apprenant),
    date_metier_mise_a_jour_statut: gestiStatutCandidat.date_metier_mise_a_jour_statut
      ? parseGestiDate(gestiStatutCandidat.date_metier_mise_a_jour_statut)
      : "",
    formation_cfd: gestiStatutCandidat.id_formation,
    source: config.users.gesti.name,
    periode_formation: gestiStatutCandidat.periode_formation
      ? gestiStatutCandidat.periode_formation.split("-").map(Number)
      : null,
    annee_formation: gestiStatutCandidat.annee_formation ? Number(gestiStatutCandidat.annee_formation) : null,
    siret_etablissement: gestiStatutCandidat.siret_etablissement.replace(/(\s|\.)/g, ""),
    annee_scolaire: gestiStatutCandidat.annee_scolaire,
    id_erp_apprenant: gestiStatutCandidat.id_erp_apprenant ?? null,
    tel_apprenant: gestiStatutCandidat.tel_apprenant ?? null,
    date_de_naissance_apprenant: gestiStatutCandidat.date_de_naissance_apprenant ?? null,
    etablissement_formateur_geo_coordonnees: gestiStatutCandidat.etablissement_formateur_geo_coordonnees ?? null,
    etablissement_formateur_code_postal: gestiStatutCandidat.etablissement_formateur_code_postal ?? null,
    contrat_date_debut: gestiStatutCandidat.contrat_date_debut ?? null,
    contrat_date_fin: gestiStatutCandidat.contrat_date_fin ?? null,
    contrat_date_rupture: gestiStatutCandidat.contrat_date_rupture ?? null,
  };
};

/* this schema should be located in a StatutCandidat entity validator */
const tempSchema = Joi.object({
  // required
  nom_apprenant: Joi.string().required(),
  prenom_apprenant: Joi.string().required(),
  uai_etablissement: Joi.string().required(),
  nom_etablissement: Joi.string().required(),
  formation_cfd: Joi.string().required(),
  statut_apprenant: Joi.number().required(),
  ne_pas_solliciter: Joi.boolean().required(),
  annee_scolaire: anneeScolaireSchema,
  // optional
  ine_apprenant: Joi.string().allow(null, ""),
  prenom2_apprenant: Joi.string().allow(null, ""),
  prenom3_apprenant: Joi.string().allow(null, ""),
  email_contact: Joi.string().allow(null, ""),
  libelle_court_formation: Joi.string().allow(null, ""),
  libelle_long_formation: Joi.string().allow(null, ""),
  siret_etablissement: Joi.string().allow(null, ""),
  date_metier_mise_a_jour_statut: Joi.date().allow(null, ""),
  source: Joi.string().allow(null, ""),
  periode_formation: Joi.array().items(Joi.number()).allow(null),
  annee_formation: Joi.number().allow(null),
  id_erp_apprenant: Joi.string().allow(null),
  tel_apprenant: Joi.string().allow(null),
  date_de_naissance_apprenant: Joi.date().allow(null),
  etablissement_formateur_geo_coordonnees: Joi.string().allow(null),
  etablissement_formateur_code_postal: Joi.string().allow(null),
  contrat_date_debut: Joi.date().allow(null),
  contrat_date_fin: Joi.date().allow(null),
  contrat_date_rupture: Joi.date().allow(null),

  // TODO remove when ERPs stop sending us this information
  nom_representant_legal: Joi.string().allow(null, ""),
  tel_representant_legal: Joi.string().allow(null, ""),
  tel2_representant_legal: Joi.string().allow(null, ""),
});

const validateInput = (input) => {
  let validStatutsCandidats = [];
  let inputValidationErrors = [];

  input.forEach((statutCandidat, index) => {
    const { error } = tempSchema.validate(statutCandidat, { abortEarly: false });

    if (error) {
      logger.error("Validation error for input element number", index + 1);
      inputValidationErrors.push({
        index: index,
        details: error.details.map(({ message, path }) => ({ message, path })),
      });
      return;
    }

    validStatutsCandidats.push(statutCandidat);
  });

  return { valid: validStatutsCandidats, errors: inputValidationErrors };
};

module.exports = {
  adaptGestiStatutCandidat,
  validateInput,
};
