const Joi = require("joi");
const config = require("../../../../config");

const logger = require("../../logger");

// parse date as DD/MM/YYYY
const parseGestiDate = (gestiDate) => {
  const [day, month, year] = gestiDate.split("/");
  return new Date(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
};

const adaptGestiStatutCandidat = (gestiStatutCandidat) => {
  return {
    ...gestiStatutCandidat,
    ne_pas_solliciter: gestiStatutCandidat.ne_pas_solliciter === "true",
    statut_apprenant: gestiStatutCandidat.statut_apprenant && Number(gestiStatutCandidat.statut_apprenant),
    date_metier_mise_a_jour_statut: gestiStatutCandidat.date_metier_mise_a_jour_statut
      ? parseGestiDate(gestiStatutCandidat.date_metier_mise_a_jour_statut)
      : "",
    source: config.users.gesti.name,
    periode_formation: gestiStatutCandidat.periode_formation
      ? gestiStatutCandidat.periode_formation.split("-").map(Number)
      : null,
  };
};

/* this schema should be located in a StatutCandidat entity validator */
const tempSchema = Joi.object({
  ine_apprenant: Joi.string().allow(null, ""),
  nom_apprenant: Joi.string().required(),
  prenom_apprenant: Joi.string().required(),
  prenom2_apprenant: Joi.string().allow(null, ""),
  prenom3_apprenant: Joi.string().allow(null, ""),
  ne_pas_solliciter: Joi.boolean().required(),
  email_contact: Joi.string().allow(null, ""),
  nom_representant_legal: Joi.string().allow(null, ""),
  tel_representant_legal: Joi.string().allow(null, ""),
  tel2_representant_legal: Joi.string().allow(null, ""),
  id_formation: Joi.string().required(),
  libelle_court_formation: Joi.string().allow(null, ""),
  libelle_long_formation: Joi.string().allow(null, ""),
  uai_etablissement: Joi.string().required(),
  siret_etablissement: Joi.string().required(),
  nom_etablissement: Joi.string().required(),
  statut_apprenant: Joi.number().required(),
  date_metier_mise_a_jour_statut: Joi.date().allow(null, ""),
  source: Joi.string().allow(null, ""),
  periode_formation: Joi.string(),
  annee_formation: Joi.number().allow(null),
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
