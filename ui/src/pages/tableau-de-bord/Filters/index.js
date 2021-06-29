import { HStack } from "@chakra-ui/react";
import React from "react";

import { useFiltersContext } from "../FiltersContext";
import CfasFilter from "./cfas/CfasFilter";
import FormationFilter from "./formation/FormationFilter";
import PeriodeFilter from "./periode/PeriodeFilter";
import TerritoireFilter from "./territoire/TerritoireFilter";

const TableauDeBordFilters = () => {
  const { state: filters, setters } = useFiltersContext();

  return (
    <HStack spacing="4w" mt="2w" justifyContent="center">
      <TerritoireFilter
        filters={filters}
        onDepartementChange={setters.setDepartement}
        onRegionChange={setters.setRegion}
      />
      <HStack spacing="1w">
        <span>Filtrer&nbsp;:</span>
        <PeriodeFilter value={filters.date} onChange={setters.setDate} />
        <CfasFilter filters={filters} onCfaChange={setters.setCfa} onReseauChange={setters.setReseau} />
        <FormationFilter filters={filters} onFormationChange={setters.setFormation} />
      </HStack>
    </HStack>
  );
};

export default TableauDeBordFilters;
