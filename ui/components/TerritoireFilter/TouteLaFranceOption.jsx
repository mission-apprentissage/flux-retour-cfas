import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../pages/app/visualiser-les-indicateurs/FiltersContext";
import FilterOption from "../FilterOption/FilterOption";

const TouteLaFranceOption = ({ onClick }) => {
  const { state } = useFiltersContext();

  return (
    <FilterOption onClick={onClick} isSelected={state.region === null && state.departement === null}>
      Toute la France
    </FilterOption>
  );
};

TouteLaFranceOption.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default TouteLaFranceOption;
