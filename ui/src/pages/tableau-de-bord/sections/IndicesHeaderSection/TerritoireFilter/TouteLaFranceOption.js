import PropTypes from "prop-types";
import React from "react";

import { FilterOption } from "../../../../../common/components";
import { useFiltersContext } from "../../../FiltersContext";

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
