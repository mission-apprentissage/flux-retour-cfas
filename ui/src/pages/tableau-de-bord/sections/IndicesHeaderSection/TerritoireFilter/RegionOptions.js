import { List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterOption, SearchInput } from "../../../../../common/components";
import { stringContains } from "../../../../../common/utils/stringUtils";
import TouteLaFranceOption from "./TouteLaFranceOption";

const RegionOptions = ({ regions, onRegionClick, onTouteLaFranceClick, currentFilter }) => {
  const [regionSearchTerm, setRegionSearchTerm] = useState("");

  const filteredRegions = regionSearchTerm
    ? regions.filter((region) => stringContains(region.nom, regionSearchTerm))
    : regions;

  return (
    <>
      <SearchInput placeholder="Rechercher une région" value={regionSearchTerm} onChange={setRegionSearchTerm} />
      <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
        <TouteLaFranceOption onClick={onTouteLaFranceClick} />
        {filteredRegions.map((region) => (
          <FilterOption
            key={region.code}
            onClick={() => onRegionClick(region)}
            isSelected={currentFilter?.code === region.code}
          >
            {region.nom}
          </FilterOption>
        ))}
      </List>
    </>
  );
};

RegionOptions.propTypes = {
  regions: PropTypes.arrayOf(
    PropTypes.shape({
      nom: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
  onRegionClick: PropTypes.func.isRequired,
  onTouteLaFranceClick: PropTypes.func.isRequired,
  currentFilter: PropTypes.shape({
    nom: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
  }),
};

export default RegionOptions;
