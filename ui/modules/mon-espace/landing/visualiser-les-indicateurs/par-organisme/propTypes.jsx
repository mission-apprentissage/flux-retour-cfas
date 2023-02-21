import PropTypes from "prop-types";

export const infosCfaPropType = PropTypes.shape({
  uai: PropTypes.string.isRequired,
  sousEtablissements: PropTypes.arrayOf(
    PropTypes.shape({
      siret_etablissement: PropTypes.string,
      nom_etablissement: PropTypes.string,
    }).isRequired
  ).isRequired,
  nature: PropTypes.string,
  nature_validity_warning: PropTypes.bool,
  libelleLong: PropTypes.string.isRequired,
  reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
  domainesMetiers: PropTypes.arrayOf(PropTypes.string),
  adresse: PropTypes.shape({
    academie: PropTypes.string,
    code_insee: PropTypes.string,
    code_postal: PropTypes.string,
    commune: PropTypes.string,
    complete: PropTypes.string,
    departement: PropTypes.string,
    region: PropTypes.string,
  }),
});
