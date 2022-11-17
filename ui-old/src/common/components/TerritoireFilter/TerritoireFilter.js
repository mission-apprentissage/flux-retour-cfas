import PropTypes from "prop-types";
import React, { useState } from "react";

import { filtersPropTypes } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import { OverlayMenu, PrimarySelectButton } from "..";
import SecondarySelectButton from "../SelectButton/SecondarySelectButton";
import { TERRITOIRE_TYPE } from "./constants";
import TerritoiresList from "./TerritoireList";
import useTerritoiresData from "./useTerritoiresData";

const TerritoireFilter = ({ filters, onDepartementChange, onRegionChange, onTerritoireReset, variant = "primary" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useTerritoiresData();

  const onTerritoireClick = (territoire) => {
    if (!territoire) {
      onTerritoireReset();
    } else if (territoire.type === TERRITOIRE_TYPE.REGION) {
      onRegionChange(territoire);
    } else {
      onDepartementChange(territoire);
    }
    setIsOpen(false);
  };

  const value = filters.region || filters.departement;
  const buttonLabel = value?.nom || "En France";
  const onButtonClick = () => setIsOpen(!isOpen);

  return (
    <div>
      {variant === "primary" ? (
        <PrimarySelectButton onClick={onButtonClick} isActive={isOpen}>
          {buttonLabel}
        </PrimarySelectButton>
      ) : (
        <SecondarySelectButton
          onClick={onButtonClick}
          isActive={isOpen}
          isClearable={!!value}
          clearIconOnClick={() => onTerritoireReset()}
        >
          {buttonLabel}
        </SecondarySelectButton>
      )}

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
  variant: PropTypes.oneOf(["primary", "secondary"]),
};

export default TerritoireFilter;
