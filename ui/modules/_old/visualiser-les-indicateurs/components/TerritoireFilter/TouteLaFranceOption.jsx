import React from "react";
import PropTypes from "prop-types";

import { useFiltersContext } from "../../FiltersContext";
import { FilterOption } from "../../../../components";

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
