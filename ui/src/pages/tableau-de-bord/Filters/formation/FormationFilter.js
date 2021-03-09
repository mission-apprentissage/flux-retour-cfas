import { Text } from "@chakra-ui/react";
import debounce from "debounce";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import { FilterButton, OverlayMenu, SearchInput } from "../../../../common/components";
import { _post } from "../../../../common/httpClient";
import FormationsList from "./FormationsList";

const SEARCH_TERM_MIN_LENGTH = 3;
const SEARCH_DEBOUNCE_TIME = 300;

const searchFormationByLibelle = debounce(async (searchTerm, callback) => {
  const result = await _post(`/api/formations/search?searchTerm=${searchTerm}`);
  callback(result);
}, SEARCH_DEBOUNCE_TIME);

const FormationFilter = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSeachTerm] = useState("");
  const [searchResults, setSearchResults] = useState();

  useEffect(() => {
    setSearchResults();
    if (searchTerm.length >= SEARCH_TERM_MIN_LENGTH) {
      searchFormationByLibelle(searchTerm, (result) => {
        if (result) setSearchResults(result);
      });
    }
  }, [searchTerm]);

  const onFormationClick = (formation) => {
    onChange(formation);
    setIsOpen(false);
  };
  const buttonLabel = isOpen ? "Sélectionner une formation" : value ? value.libelle : "Toutes les formations";

  return (
    <div>
      <FilterButton onClick={() => setIsOpen(!isOpen)}>{buttonLabel}</FilterButton>
      {isOpen && (
        <OverlayMenu onClose={() => setIsOpen(false)}>
          <SearchInput
            value={searchTerm}
            onChange={setSeachTerm}
            placeholder="Saisissez un libellé de formation ou un CFD"
          />
          <FormationsList formations={searchResults} onFormationClick={onFormationClick} selectedValue={value} />
          {searchResults?.length === 0 && (
            <Text fontSize="zeta" color="gray.500">
              Aucun résultat trouvé
            </Text>
          )}
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
};

export default FormationFilter;
