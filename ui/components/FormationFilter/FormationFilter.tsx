import PropTypes from "prop-types";
import React, { useState } from "react";

import OverlayMenu from "@/components/OverlayMenu/OverlayMenu";
import PrimarySelectButton from "@/components/SelectButton/PrimarySelectButton";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import { filtersPropTypes } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

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
