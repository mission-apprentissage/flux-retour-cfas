import { Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { OverlayMenu, SearchInput, SecondarySelectButton } from "../../../../common/components";
import { filtersPropTypes } from "../../FiltersContext";
import FormationsList from "./FormationsList";
import withFormationSearch from "./withFormationSearch";

const FormationFilter = ({ filters, searchTerm, searchResults, onSearchTermChange, onFormationChange }) => {
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
          <SearchInput
            value={searchTerm}
            onChange={onSearchTermChange}
            placeholder="Rechercher un libellé de formation ou un CFD"
          />
          {searchResults?.length === 0 && (
            <Text fontSize="zeta" color="grey.500" paddingTop="1w" paddingLeft="1w">
              Aucun résultat trouvé
            </Text>
          )}
          <FormationsList
            formations={searchResults}
            onFormationClick={onFormationClick}
            selectedValue={filters.formation}
          />
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
  onSearchTermChange: PropTypes.func.isRequired,
  onFormationChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  filters: filtersPropTypes.state,
};

export default withFormationSearch(FormationFilter);
