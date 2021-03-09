import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterButton, OverlayMenu } from "../../../../common/components";
import MenuTabs from "../../../../common/components/OverlayMenu/MenuTabs";
import { useFetch } from "../../../../common/hooks/useFetch";
import DepartementOptions from "./DepartementOptions";
import RegionOptions from "./RegionOptions";

const GEO_API_URL = "https://geo.api.gouv.fr";

const TERRITOIRE_TYPES = {
  region: "region",
  departement: "departement",
};

const TerritoireFilter = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [departements] = useFetch(`${GEO_API_URL}/departements`);
  const [regions] = useFetch(`${GEO_API_URL}/regions`);

  const TERRITOIRE_TYPE_OPTIONS = [
    { value: TERRITOIRE_TYPES.region, label: `Régions (${regions?.length})` },
    { value: TERRITOIRE_TYPES.departement, label: `Départements (${departements?.length})` },
  ];

  const onFilterClick = (territoireType) => (filter) => {
    const value = filter ? { type: territoireType, code: filter.code } : null;
    onChange(value);
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
      <FilterButton onClick={() => setIsOpen(!isOpen)} icon="ri-map-pin-fill">
        {buttonLabel}
      </FilterButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <MenuTabs tabNames={TERRITOIRE_TYPE_OPTIONS.map(({ label }) => label)}>
            <RegionOptions
              regions={regions}
              onRegionClick={onFilterClick(TERRITOIRE_TYPES.region)}
              currentFilter={chosenFilter}
            />
            <DepartementOptions
              departements={departements}
              onDepartementClick={onFilterClick(TERRITOIRE_TYPES.departement)}
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
  value: PropTypes.shape({
    code: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
};

export default TerritoireFilter;
