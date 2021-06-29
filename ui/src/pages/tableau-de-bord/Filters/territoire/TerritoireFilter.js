import { Box } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterButton, OverlayMenu } from "../../../../common/components";
import MenuTabs from "../../../../common/components/OverlayMenu/MenuTabs";
import { filtersPropTypes } from "../../FiltersContext";
import DepartementOptions from "./DepartementOptions";
import RegionOptions from "./RegionOptions";
import withTerritoiresData from "./withTerritoireData";

const TerritoireFilter = ({ filters, onRegionChange, onDepartementChange, regions, departements }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onDepartementClick = (departement) => {
    onDepartementChange(departement);
    setIsOpen(false);
  };

  const onRegionClick = (departement) => {
    onRegionChange(departement);
    setIsOpen(false);
  };

  const tabLabels = [`Régions (${regions.length})`, `Départements (${departements.length})`];

  const buttonLabel = filters.region?.nom || filters.departement?.nom;

  return (
    <div>
      <FilterButton onClick={() => setIsOpen(!isOpen)} icon="ri-map-pin-2-fill">
        {buttonLabel}
        <Box fontSize="delta" as="i" className="ri-arrow-down-s-line" marginLeft="1v" />
      </FilterButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <MenuTabs tabNames={tabLabels}>
            <RegionOptions regions={regions} onRegionClick={onRegionClick} currentFilter={filters.region} />
            <DepartementOptions
              departements={departements}
              onDepartementClick={onDepartementClick}
              currentFilter={filters.departement}
            />
          </MenuTabs>
        </OverlayMenu>
      )}
    </div>
  );
};

TerritoireFilter.propTypes = {
  onRegionChange: PropTypes.func.isRequired,
  onDepartementChange: PropTypes.func.isRequired,
  filters: filtersPropTypes.state,
  regions: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
  departements: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
};

export default withTerritoiresData(TerritoireFilter);
