import { HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { filtersPropType } from "../propTypes";
import CfasFilter from "./cfas/CfasFilter";
import FormationFilter from "./formation/FormationFilter";
import PeriodeFilter from "./periode/PeriodeFilter";
import TerritoireFilter from "./territoire/TerritoireFilter";

const TableauDeBordFilters = ({ filters, setFilters }) => {
  const handlePeriodeFilterChange = (date) => {
    setFilters({ ...filters, date });
  };

  const handleTerritoireFilterChange = (territoire) => {
    setFilters({ ...filters, territoire, cfa: null });
  };

  const handleFormationFilterChange = (formation) => {
    setFilters({ ...filters, formation });
  };

  const handleCfaFilterChange = (cfa) => {
    setFilters({ ...filters, territoire: null, cfa });
  };

  return (
    <HStack spacing="4w" mt="2w" justifyContent="center">
      <TerritoireFilter value={filters.territoire} onChange={handleTerritoireFilterChange} />
      <HStack spacing="1w">
        <span>Filtrer&nbsp;:</span>
        <PeriodeFilter value={filters.date} onChange={handlePeriodeFilterChange} />
        <CfasFilter value={filters.cfa} onChange={handleCfaFilterChange} filters={filters} />
        <FormationFilter value={filters.formation} onChange={handleFormationFilterChange} />
      </HStack>
    </HStack>
  );
};

TableauDeBordFilters.propTypes = {
  setFilters: PropTypes.func.isRequired,
  filters: filtersPropType.isRequired,
};

export default TableauDeBordFilters;
