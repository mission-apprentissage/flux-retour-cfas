import PropTypes from "prop-types";
import React, { useState } from "react";

import { OverlayMenu, PrimarySelectButton } from "../../../../../common/components";
import { filtersPropTypes } from "../../../FiltersContext";
import TerritoiresList from "./TerritoireList";
import useTerritoiresData from "./useTerritoiresData";

const TerritoireFilter = ({ filters, onDepartementChange, onRegionChange, onTerritoireReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useTerritoiresData();

  const onTerritoireClick = (territoire) => {
    if (!territoire) {
      onTerritoireReset();
    } else if (territoire.type === "region") {
      onRegionChange(territoire);
    } else {
      onDepartementChange(territoire);
    }
    setIsOpen(false);
  };

  const buttonLabel = filters.region?.nom || filters.departement?.nom || "En France";

  return (
    <div>
      <PrimarySelectButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        {buttonLabel}
      </PrimarySelectButton>

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <TerritoiresList data={data} onTerritoireClick={onTerritoireClick} currentFilter={filters.region} />
        </OverlayMenu>
      )}
    </div>
  );
};

TerritoireFilter.propTypes = {
  onDepartementChange: PropTypes.func.isRequired,
  onRegionChange: PropTypes.func.isRequired,
  onTerritoireReset: PropTypes.func.isRequired,
  filters: filtersPropTypes.state,
};

export default TerritoireFilter;
