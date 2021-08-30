import PropTypes from "prop-types";
import React, { useState } from "react";

import { MenuTabs, OverlayMenu, PrimarySelectButton } from "../../../../../common/components";
import { filtersPropTypes } from "../../../FiltersContext";
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

  const tabLabels = [`Région (${regions.length})`, `Département (${departements.length})`];

  const buttonLabel = filters.region?.nom || filters.departement?.nom;

  return (
    <div>
      <PrimarySelectButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        {buttonLabel}
      </PrimarySelectButton>

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
