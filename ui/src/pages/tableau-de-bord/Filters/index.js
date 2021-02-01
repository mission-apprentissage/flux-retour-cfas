import { HStack, Select } from "@chakra-ui/react";
import React, { useState } from "react";

import TerritoireFilter from "./territoire/TerritoireFilter";

const periodes = [
  { value: "2020", label: "Année en cours (2020-2021)" },
  { value: "2019", label: "2019-2020" },
];

const ObservatoireFilters = () => {
  const [filters, setFilters] = useState({
    periode: "2020",
    territoire: "france",
    formation: undefined,
  });

  const handlePeriodFilterChange = (ev) => {
    setFilters({ ...filters, periode: ev.target.value });
  };

  const handleTerritoireFilterChange = (territoireFilter) => {
    setFilters({ ...filters, territoire: territoireFilter, formation: "" });
  };

  const handleFormationFilterChange = (ev) => {
    setFilters({ ...filters, formation: ev.target.value });
  };

  return (
    <>
      <HStack spacing="2w" mt="4w" textAlign="center">
        <Select
          placeholder="Sélectionner une période"
          background="white"
          value={filters.periode}
          onChange={handlePeriodFilterChange}
        >
          {periodes.map((periode) => (
            <option key={periode.value} value={periode.value}>
              {periode.label}
            </option>
          ))}
        </Select>
        <TerritoireFilter onChange={handleTerritoireFilterChange} />
        <Select
          placeholder="Sélectionner une formation"
          background="white"
          value={filters.formation}
          onChange={handleFormationFilterChange}
        >
          <option value="all">Toutes les formations</option>
          <option value="hello">BTSA Viticulture/Oenologie</option>
          <option value="world">CAP Menuiserie</option>
        </Select>
      </HStack>
    </>
  );
};

export default ObservatoireFilters;
