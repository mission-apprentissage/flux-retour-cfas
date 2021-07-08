import PropTypes from "prop-types";

export const effectifsPropType = PropTypes.shape({
  apprentis: PropTypes.shape({
    count: PropTypes.number.isRequired,
  }).isRequired,
  jeunesSansContrat: PropTypes.shape({
    count: PropTypes.number.isRequired,
  }).isRequired,
  abandons: PropTypes.shape({
    count: PropTypes.number.isRequired,
  }).isRequired,
  rupturants: PropTypes.shape({
    count: PropTypes.number.isRequired,
  }).isRequired,
});
