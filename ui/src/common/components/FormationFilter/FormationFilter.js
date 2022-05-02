import PropTypes from "prop-types";
import React, { useState } from "react";

import { filtersPropTypes } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import OverlayMenu from "../OverlayMenu/OverlayMenu";
import SecondarySelectButton from "../SelectButton/SecondarySelectButton";
import FormationFilterMenu from "./FormationFilterMenu";

const FormationFilter = ({ filters, onFormationChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onFormationClick = (formation) => {
    onFormationChange(formation);
    setIsOpen(false);
  };
  const buttonLabel = filters.formation?.libelle || "par formations";

  return (
    <div>
      <SecondarySelectButton
        icon="ri-bookmark-2-fill"
        onClick={() => setIsOpen(!isOpen)}
        isActive={isOpen}
        isClearable={!!filters.formation}
        clearIconOnClick={() => onFormationChange(null)}
      >
        {buttonLabel}
      </SecondarySelectButton>
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
};

export default FormationFilter;
