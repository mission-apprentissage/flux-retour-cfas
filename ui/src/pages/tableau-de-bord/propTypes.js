import PropTypes from "prop-types";

export const effectifsPropType = PropTypes.shape({
  apprentis: PropTypes.shape({
    count: PropTypes.number.isRequired,
    evolution: PropTypes.number,
  }).isRequired,
  inscrits: PropTypes.shape({
    count: PropTypes.number.isRequired,
    evolution: PropTypes.number,
  }).isRequired,
  abandons: PropTypes.shape({
    count: PropTypes.number.isRequired,
    evolution: PropTypes.number,
  }).isRequired,
});
