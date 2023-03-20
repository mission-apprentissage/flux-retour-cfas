import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import OverlayMenu from "@/components/OverlayMenu/OverlayMenu";
import PrimarySelectButton from "@/components/SelectButton/PrimarySelectButton";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import TerritoiresList from "./TerritoireList";
import { filtersPropTypes } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import {
  REGIONS_SORTED,
  DEPARTEMENTS_SORTED,
  DEPARTEMENTS_BY_ID,
  TERRITOIRE_TYPE,
  REGIONS_BY_ID,
} from "@/common/constants/territoiresConstants";
import useAuth from "@/hooks/useAuth";

const TerritoireFilter = ({ filters, onDepartementChange, onRegionChange, onTerritoireReset, variant = "primary" }) => {
  const [isOpen, setIsOpen] = useState(false);
  let { auth } = useAuth();

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

  // affiche seulement les régions et départements accessibles à l'utilisateur
  // l'accès à un département donne également accès à la région (DDETS)
  const territoiresConfig = { regions: REGIONS_SORTED, departements: DEPARTEMENTS_SORTED, showAllOption: true };

  // filtre initial positionné sur la région / département de l'utilisateur
  useEffect(() => {
    if (auth.organisation.code_region) {
      onRegionChange(REGIONS_BY_ID[auth.organisation.code_region]);
    } else if (auth.organisation.code_departement) {
      onDepartementChange(DEPARTEMENTS_BY_ID[auth.organisation.code_departement]);
      // TODO
      // } else if (auth.organisation.code_academie) {
      //   onAcademieChange(ACADEMIES_BY_ID[auth.organisation.code_academie]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <TerritoiresList
            config={territoiresConfig}
            onTerritoireClick={onTerritoireClick}
            currentFilter={filters.region}
          />
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
