import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterButton, OverlayMenu } from "../../../../common/components";
import MenuTabs from "../../../../common/components/OverlayMenu/MenuTabs";
import DepartementOptions from "./DepartementOptions";
import { territoireOptionPropType } from "./propTypes";
import RegionOptions from "./RegionOptions";
import withTerritoiresData, { TERRITOIRE_TYPES } from "./withTerritoireData";

const TerritoireFilter = ({ value, onChange, regions, departements }) => {
  const [isOpen, setIsOpen] = useState(false);

  const TERRITOIRE_TYPE_OPTIONS = [
    { value: TERRITOIRE_TYPES.region, label: `Régions (${regions.length})` },
    { value: TERRITOIRE_TYPES.departement, label: `Départements (${departements.length})` },
  ];

  const onFilterClick = (filter) => {
    onChange(filter);
    setIsOpen(false);
  };

  const chosenFilter = !value
    ? null
    : value.type === TERRITOIRE_TYPES.region
    ? regions.find((region) => region.code === value.code)
    : departements.find((departement) => departement.code === value.code);

  const buttonLabel = chosenFilter ? chosenFilter.nom : "Toute la France";

  return (
    <div>
      <FilterButton
        onClick={() => setIsOpen(!isOpen)}
        icon="ri-map-pin-2-fill"
        displayClearIcon={!!value}
        clearIconOnClick={() => onChange(null)}
      >
        {buttonLabel}
      </FilterButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <MenuTabs tabNames={TERRITOIRE_TYPE_OPTIONS.map(({ label }) => label)}>
            <RegionOptions regions={regions} onRegionClick={onFilterClick} currentFilter={chosenFilter} />
            <DepartementOptions
              departements={departements}
              onDepartementClick={onFilterClick}
              currentFilter={chosenFilter}
            />
          </MenuTabs>
        </OverlayMenu>
      )}
    </div>
  );
};

TerritoireFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: territoireOptionPropType,
  regions: PropTypes.arrayOf(territoireOptionPropType).isRequired,
  departements: PropTypes.arrayOf(territoireOptionPropType).isRequired,
};

export default withTerritoiresData(TerritoireFilter);
