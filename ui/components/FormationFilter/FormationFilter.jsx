import PropTypes from "prop-types";
import React, { useState } from "react";

import { filtersPropTypes } from "../../components/_pagesComponents/FiltersContext.js";
import OverlayMenu from "../OverlayMenu/OverlayMenu";
import PrimarySelectButton from "../SelectButton/PrimarySelectButton";
import SecondarySelectButton from "../SelectButton/SecondarySelectButton";
import FormationFilterMenu from "./FormationFilterMenu";

const FormationFilter = ({ filters, onFormationChange, variant = "primary" }) => {
  const [isOpen, setIsOpen] = useState(false);

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
  variant: PropTypes.oneOf(["primary", "secondary"]),
};

export default FormationFilter;
