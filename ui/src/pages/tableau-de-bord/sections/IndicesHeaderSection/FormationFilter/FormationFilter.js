import PropTypes from "prop-types";
import React, { useState } from "react";

import { OverlayMenu, SecondarySelectButton } from "../../../../../common/components";
import { filtersPropTypes } from "../../../FiltersContext";
import FormationFilterMenu from "./FormationFilterMenu";

const FormationFilter = ({ filters, onFormationChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onFormationClick = (formation) => {
    onFormationChange(formation);
    setIsOpen(false);
  };
  const buttonLabel = filters.formation?.libelle || "Sélectionner une formation";

  return (
    <div>
      <SecondarySelectButton
        icon="ri-book-mark-fill"
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
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      cfd: PropTypes.string.isRequired,
      libelle: PropTypes.string.isRequired,
    })
  ),
  onFormationChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  filters: filtersPropTypes.state,
};

export default FormationFilter;
