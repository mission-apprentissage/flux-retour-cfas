/**
 * Mapping des organismes du référentiel vers l'API
 */
const toOrganismes = (referentielOrganisme) => ({
  uai: referentielOrganisme.uai,
  siret: referentielOrganisme.siret,
  siren: referentielOrganisme.siret.substring(0, 8),
  nature: referentielOrganisme.nature,
  reseaux: referentielOrganisme.reseaux?.map((item) => item.label),
  nom_etablissement: referentielOrganisme.raison_sociale,
  adresse: referentielOrganisme.adresse?.label,
  region: referentielOrganisme.adresse?.region?.nom,
  academie: referentielOrganisme.adresse?.academie?.nom,
});

module.exports = { toOrganismes };
