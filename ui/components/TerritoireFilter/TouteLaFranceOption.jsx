import PropTypes from "prop-types";
import React from "react";

import FilterOption from "@/components/FilterOption/FilterOption";
import { useSimpleFiltersContext } from "@/modules/mon-espace/landing/common/SimpleFiltersContext";

const TouteLaFranceOption = ({ onClick }) => {
  const { filtersValues } = useSimpleFiltersContext();

  return (
    <FilterOption onClick={onClick} isSelected={filtersValues.region === null && filtersValues.departement === null}>
      Toute la France
    </FilterOption>
  );
};

TouteLaFranceOption.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default TouteLaFranceOption;
