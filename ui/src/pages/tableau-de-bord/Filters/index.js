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
    <HStack spacing="2w" mt="2w" justifyContent="center">
      <PeriodeFilter value={filters.date} onChange={handlePeriodeFilterChange} />
      <TerritoireFilter value={filters.territoire} onChange={handleTerritoireFilterChange} />
      <CfasFilter value={filters.cfa} onChange={handleCfaFilterChange} />
      <FormationFilter value={filters.formation} onChange={handleFormationFilterChange} />
    </HStack>
  );
};

TableauDeBordFilters.propTypes = {
  setFilters: PropTypes.func.isRequired,
  filters: filtersPropType.isRequired,
};

export default TableauDeBordFilters;
