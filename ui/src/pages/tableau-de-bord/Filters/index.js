import { HStack } from "@chakra-ui/react";
import { subMonths } from "date-fns";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import CfasFilter from "./cfas/CfasFilter";
import FormationFilter from "./formation/FormationFilter";
import PeriodeFilter from "./periode/PeriodeFilter";
import TerritoireFilter from "./territoire/TerritoireFilter";

const TableauDeBordFilters = ({ onChange }) => {
  const [filters, setFilters] = useState({
    periode: {
      startDate: subMonths(new Date(), 1),
      endDate: new Date(),
    },
    territoire: null,
    formation: null,
    cfa: null,
  });

  const handlePeriodeFilterChange = ({ startDate, endDate }) => {
    setFilters({ ...filters, periode: { startDate, endDate } });
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

  useEffect(() => {
    const hasAtLeastOneFilterSelected = Boolean(filters.territoire || filters.cfa || filters.formation);
    if (filters.periode.startDate && filters.periode.endDate && hasAtLeastOneFilterSelected) {
      onChange(filters);
    }
  }, [filters]);

  return (
    <HStack spacing="2w" mt="2w" justifyContent="center">
      <PeriodeFilter value={filters.periode} onChange={handlePeriodeFilterChange} />
      <TerritoireFilter value={filters.territoire} onChange={handleTerritoireFilterChange} />
      <CfasFilter value={filters.cfa} onChange={handleCfaFilterChange} />
      <FormationFilter value={filters.formation} onChange={handleFormationFilterChange} />
    </HStack>
  );
};

TableauDeBordFilters.propTypes = {
  onChange: PropTypes.func.isRequired,
};

export default TableauDeBordFilters;
