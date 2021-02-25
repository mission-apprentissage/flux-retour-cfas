import { Box, Divider, HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterButton, OverlayMenu } from "../../../../common/components";
import { useFetch } from "../../../../common/hooks/useFetch";
import DepartementOptions from "./DepartementOptions";
import RegionOptions from "./RegionOptions";

const GEO_API_URL = "https://geo.api.gouv.fr";

const TERRITOIRE_TYPES = {
  region: "region",
  departement: "departement",
};

const TerritoireTypeOption = ({ isSelected = false, onClick, children }) => {
  return (
    <Box
      cursor="pointer"
      _hover={{ borderBottom: "4px solid" }}
      onClick={onClick}
      color={isSelected ? "bluefrance" : "grey.600"}
      borderBottom={isSelected ? "4px solid" : "none"}
      paddingBottom="1w"
      role="button"
    >
      {children}
    </Box>
  );
};

TerritoireTypeOption.propTypes = {
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

const TerritoireFilter = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTerritoireType, setSelectedTerritoireType] = useState(TERRITOIRE_TYPES.region);

  const [departements] = useFetch(`${GEO_API_URL}/departements`);
  const [regions] = useFetch(`${GEO_API_URL}/regions`);

  const TERRITOIRE_TYPE_OPTIONS = [
    { value: TERRITOIRE_TYPES.region, label: `Régions (${regions?.length})` },
    { value: TERRITOIRE_TYPES.departement, label: `Départements (${departements?.length})` },
  ];

  const onFilterClick = (territoireType) => (filter) => {
    const value = filter ? { type: territoireType, code: filter.code } : null;
    onChange(value);
  };

  const chosenFilter = !value
    ? null
    : value.type === TERRITOIRE_TYPES.region
    ? regions.find((region) => region.code === value.code)
    : departements.find((departement) => departement.code === value.code);

  const buttonLabel = isOpen ? "Sélectionner un territoire" : chosenFilter ? chosenFilter.nom : "Toute la France";

  return (
    <div>
      <FilterButton onClick={() => setIsOpen(!isOpen)} icon="ri-map-pin-fill">
        {buttonLabel}
      </FilterButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <HStack spacing="4w">
            {TERRITOIRE_TYPE_OPTIONS.map(({ value, label }) => (
              <TerritoireTypeOption
                key={value}
                onClick={() => {
                  setSelectedTerritoireType(value);
                }}
                isSelected={selectedTerritoireType === value}
              >
                {label}
              </TerritoireTypeOption>
            ))}
          </HStack>
          {selectedTerritoireType && (
            <>
              <Divider marginBottom="3w" />
              {selectedTerritoireType === TERRITOIRE_TYPES.departement && (
                <DepartementOptions
                  departements={departements}
                  onDepartementClick={onFilterClick(TERRITOIRE_TYPES.departement)}
                  currentFilter={chosenFilter}
                />
              )}
              {selectedTerritoireType === TERRITOIRE_TYPES.region && (
                <RegionOptions
                  regions={regions}
                  onRegionClick={onFilterClick(TERRITOIRE_TYPES.region)}
                  currentFilter={chosenFilter}
                />
              )}
            </>
          )}
        </OverlayMenu>
      )}
    </div>
  );
};

TerritoireFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    code: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
};

export default TerritoireFilter;
