import { Input, InputGroup, InputLeftElement, List } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import TerritoireOption from "./TerritoireOption";

const RegionOptions = ({ regions = [], onRegionClick, currentFilter }) => {
  const [regionSearchTerm, setRegionSearchTerm] = useState("");

  const filteredRegions = regionSearchTerm
    ? regions.filter((region) => {
        return region.nom.toLowerCase().indexOf(regionSearchTerm.toLowerCase()) > -1;
      })
    : regions;

  return (
    <>
      <InputGroup>
        <InputLeftElement pointerEvents="none" className="ri-search-line" as="i" paddingBottom="1w" />
        <Input
          placeholder="Saisissez une région"
          value={regionSearchTerm}
          onChange={(event) => setRegionSearchTerm(event.target.value)}
          size="sm"
          autoFocus
        />
      </InputGroup>
      <List spacing="1v" marginTop="1w" textAlign="left" maxHeight="15rem" overflow="scroll">
        <TerritoireOption
          onClick={() => {
            onRegionClick(null);
          }}
          isSelected={currentFilter === null}
        >
          Toute la France
        </TerritoireOption>
        {filteredRegions.map((region) => (
          <TerritoireOption
            key={region.code}
            onClick={() => onRegionClick(region)}
            isSelected={currentFilter?.nom === region.nom}
          >
            {region.nom}
          </TerritoireOption>
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
  ),
  onRegionClick: PropTypes.func.isRequired,
  currentFilter: PropTypes.shape({
    nom: PropTypes.string.isRequired,
  }),
};

export default RegionOptions;
