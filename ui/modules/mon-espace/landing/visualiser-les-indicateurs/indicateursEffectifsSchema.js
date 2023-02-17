import PropTypes from "prop-types";

export const indicateursEffectifsSchema = {
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
  }),
};
