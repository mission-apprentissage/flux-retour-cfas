import PropTypes from "prop-types";
import React from "react";

import FilterOption from "@/components/FilterOption/FilterOption";
import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

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
