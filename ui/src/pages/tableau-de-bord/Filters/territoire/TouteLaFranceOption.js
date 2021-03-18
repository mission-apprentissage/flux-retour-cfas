import PropTypes from "prop-types";
import React from "react";

import FilterOption from "../FilterOption";

const TouteLaFranceOption = ({ onClick, isSelected }) => {
  return (
    <FilterOption onClick={onClick} isSelected={isSelected}>
      Toute la France
    </FilterOption>
  );
};

TouteLaFranceOption.propTypes = {
  onClick: PropTypes.func.isRequired,
  isSelected: PropTypes.shape({
    nom: PropTypes.string.isRequired,
  }),
};

export default TouteLaFranceOption;
