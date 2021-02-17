import { HStack } from "@chakra-ui/react";
import { subYears } from "date-fns";
import React, { useState } from "react";

import PeriodeFilter from "./periode/PeriodeFilter";
import TerritoireFilter from "./territoire/TerritoireFilter";

const TableauDeBordFilters = () => {
  const [filters, setFilters] = useState({
    periode: {
      date1: subYears(new Date(), 1),
      date2: new Date(),
    },
    territoire: undefined,
    formation: undefined,
  });

  const handlePeriodeFilterChange = ({ date1, date2 }) => {
    setFilters({ ...filters, periode: { date1, date2 } });
  };

  const handleTerritoireFilterChange = (territoire) => {
    setFilters({ ...filters, territoire });
  };

  return (
    <HStack spacing="2w" mt="4w" justifyContent="center" center>
      <PeriodeFilter date1={filters.periode.date1} date2={filters.periode.date2} onChange={handlePeriodeFilterChange} />
      <TerritoireFilter value={filters.territoire} onChange={handleTerritoireFilterChange} />
    </HStack>
  );
};

export default TableauDeBordFilters;
