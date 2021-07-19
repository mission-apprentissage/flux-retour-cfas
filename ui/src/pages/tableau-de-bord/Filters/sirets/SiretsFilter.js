import PropTypes from "prop-types";
import React, { useState } from "react";

import { OverlayMenu, SecondarySelectButton } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import SiretsList from "./SiretsList";

const SiretsFilter = ({ sirets, onSiretChange, filters }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onSiretClick = (reseau) => {
    onSiretChange(reseau);
    setIsOpen(false);
  };

  const buttonLabel = filters.siret ? `SIRET : ${filters.siret}` : "Tous les SIRETS";

  return (
    <>
      <SecondarySelectButton
        onClick={() => setIsOpen(!isOpen)}
        isClearable={Boolean(filters.siret)}
        clearIconOnClick={() => {
          onSiretChange(null);
        }}
      >
        {buttonLabel}
      </SecondarySelectButton>
      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <SiretsList sirets={sirets} onSiretClick={onSiretClick} value={filters.siret}></SiretsList>
        </OverlayMenu>
      )}
    </>
  );
};

SiretsFilter.propTypes = {
  sirets: PropTypes.arrayOf(PropTypes.string),
  onSiretChange: PropTypes.func.isRequired,
  filters: filtersPropTypes.state,
};

export default SiretsFilter;
