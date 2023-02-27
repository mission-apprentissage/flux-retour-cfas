import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";

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
  let [user] = useAuth();

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
  const territoiresData = useMemo(() => {
    const codesRegionsAccessibles = [
      // région de l'utilisateur (exemple si DREETS)
      ...(user.codes_region ?? []),
      // régions du département de l'utilisateur (exemple si DDETS)
      ...(user.codes_departement?.map((codeDepartement) => DEPARTEMENTS_BY_ID[codeDepartement].region.code) ?? []),
    ];
    return codesRegionsAccessibles.length > 0
      ? {
          regions: REGIONS_SORTED.filter((region) => codesRegionsAccessibles.includes(region.code)),
          departements: DEPARTEMENTS_SORTED.filter((departement) =>
            codesRegionsAccessibles.includes(departement.region.code)
          ),
        }
      : { regions: REGIONS_SORTED, departements: DEPARTEMENTS_SORTED };
  }, [user]);

  // filtre initial positionné sur la région / département de l'utilisateur
  useEffect(() => {
    if (user.codes_region?.[0]) {
      onRegionChange(REGIONS_BY_ID[user.codes_region[0]]);
    } else if (user.codes_departement?.[0]) {
      onDepartementChange(DEPARTEMENTS_BY_ID[user.codes_departement[0]]);
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
            data={territoiresData}
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
