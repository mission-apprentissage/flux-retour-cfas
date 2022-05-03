import PropTypes from "prop-types";
import React, { useState } from "react";

import { filtersPropTypes } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import OverlayMenu from "../OverlayMenu/OverlayMenu";
import PrimarySelectButton from "../SelectButton/PrimarySelectButton";
import SecondarySelectButton from "../SelectButton/SecondarySelectButton";
import FormationFilterMenu from "./FormationFilterMenu";

const FormationFilter = ({ filters, onFormationChange, defaultIsOpen = false, variant = "primary" }) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  const onFormationClick = (formation) => {
    onFormationChange(formation);
    setIsOpen(false);
  };
  const buttonText = variant === "primary" ? "Sélectionner une formation" : "par formation";
  const buttonLabel = filters.formation?.libelle || buttonText;
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
          isClearable={!!filters.formation}
          clearIconOnClick={() => onFormationChange(null)}
        >
          {buttonLabel}
        </SecondarySelectButton>
      )}
      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <FormationFilterMenu onFormationClick={onFormationClick} filters={filters} />
        </OverlayMenu>
      )}
    </div>
  );
};

FormationFilter.propTypes = {
  onFormationChange: PropTypes.func.isRequired,
  filters: filtersPropTypes.state,
  defaultIsOpen: PropTypes.bool,
  variant: PropTypes.oneOf(["primary", "secondary"]),
};

export default FormationFilter;
