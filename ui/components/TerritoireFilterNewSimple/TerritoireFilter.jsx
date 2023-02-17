import PropTypes from "prop-types";
import React, { useState } from "react";

import OverlayMenu from "@/components/OverlayMenu/OverlayMenu";
import PrimarySelectButton from "@/components/SelectButton/PrimarySelectButton";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import TerritoiresList from "./TerritoireList";
import { useSimpleFiltersContext } from "@/modules/mon-espace/landing/common/SimpleFiltersContext";
import { TERRITOIRE_TYPE } from "@/common/constants/territoiresConstants";
import { MapPinRangeFill } from "@/theme/components/icons/MapPinRangeFill";

const TerritoireFilter = ({ variant = "primary" }) => {
  const { filtersValues, filtersSetters } = useSimpleFiltersContext();
  const [isOpen, setIsOpen] = useState(false);

  const onTerritoireClick = (territoire) => {
    if (!territoire) {
      filtersSetters.resetTerritoire();
    } else if (territoire.type === TERRITOIRE_TYPE.REGION) {
      filtersSetters.setRegion(territoire);
    } else {
      filtersSetters.setDepartement(territoire);
    }
    setIsOpen(false);
  };

  const territoire = filtersValues.region || filtersValues.departement;
  const buttonLabel = territoire?.nom || "En France";
  const onButtonClick = () => setIsOpen(!isOpen);

  return (
    <section>
      <MapPinRangeFill mr=".5rem" boxSize={5} />
      {variant === "primary" ? (
        <PrimarySelectButton onClick={onButtonClick} isActive={isOpen}>
          {buttonLabel}
        </PrimarySelectButton>
      ) : (
        <SecondarySelectButton
          onClick={onButtonClick}
          isActive={isOpen}
          isClearable={!!territoire}
          clearIconOnClick={() => filtersSetters.resetTerritoire()}
        >
          {buttonLabel}
        </SecondarySelectButton>
      )}

      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <TerritoiresList onTerritoireClick={onTerritoireClick} currentFilter={filtersValues.region} />
        </OverlayMenu>
      )}
    </section>
  );
};

TerritoireFilter.propTypes = {
  variant: PropTypes.oneOf(["primary", "secondary"]),
};

export default TerritoireFilter;
