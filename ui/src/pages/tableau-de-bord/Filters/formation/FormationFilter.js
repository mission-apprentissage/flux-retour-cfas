import { Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { FilterButton, OverlayMenu, SearchInput } from "../../../../common/components";
import FormationsList from "./FormationsList";
import withFormationSearch from "./withFormationSearch";

const FormationFilter = ({ value, onChange, searchTerm, searchResults, onSearchTermChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onFormationClick = (formation) => {
    onChange(formation);
    setIsOpen(false);
  };
  const buttonLabel = value ? value.libelle : "Toutes les formations";

  return (
    <div>
      <FilterButton
        icon="ri-book-mark-fill"
        onClick={() => setIsOpen(!isOpen)}
        displayClearIcon={!!value}
        clearIconOnClick={() => onChange(null)}
      >
        {buttonLabel}
      </FilterButton>
      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <SearchInput
            value={searchTerm}
            onChange={onSearchTermChange}
            placeholder="Saisissez un libellé de formation ou un CFD"
          />
          {searchResults?.length === 0 && (
            <Text fontSize="zeta" color="grey.500" paddingTop="1w" paddingLeft="1w">
              Aucun résultat trouvé
            </Text>
          )}
          <FormationsList formations={searchResults} onFormationClick={onFormationClick} selectedValue={value} />
        </OverlayMenu>
      )}
    </div>
  );
};

FormationFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    cfd: PropTypes.string.isRequired,
    libelle: PropTypes.string.isRequired,
  }),
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      cfd: PropTypes.string.isRequired,
      libelle: PropTypes.string.isRequired,
    })
  ),
  onSearchTermChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
};

export default withFormationSearch(FormationFilter);
