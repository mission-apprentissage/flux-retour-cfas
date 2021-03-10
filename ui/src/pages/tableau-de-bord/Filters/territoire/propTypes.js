import PropTypes from "prop-types";

import { TERRITOIRE_TYPES } from "./withTerritoireData";

export const territoireOptionPropType = PropTypes.shape({
  code: PropTypes.string.isRequired,
  type: PropTypes.oneOf(TERRITOIRE_TYPES.departement, TERRITOIRE_TYPES.region),
});
