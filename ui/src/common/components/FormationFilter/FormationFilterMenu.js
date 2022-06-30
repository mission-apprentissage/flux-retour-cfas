import { Box, Divider, Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { filtersPropTypes } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import InputLegend from "../InputLegend/InputLegend";
import Loading from "../Loading/Loading";
import NoResults from "../NoResults/NoResults";
import SearchInput from "../SearchInput/SearchInput";
import FormationsList from "./FormationsList";
import useFormationSearch, { MINIMUM_CHARS_TO_PERFORM_SEARCH } from "./useFormationSearch";

const FormationFilterMenu = ({ filters, onFormationClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, loading } = useFormationSearch(searchTerm, filters);

  return (
    <>
      <Heading as="h3" variant="h3" marginBottom="3w" marginTop="2w">
        Sélectionner une formation
      </Heading>
      <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Intitulé de la formation, CFD, RNCP" />
      {searchTerm.length < MINIMUM_CHARS_TO_PERFORM_SEARCH && (
        <Box paddingLeft="1w" paddingTop="3v">
          <InputLegend>
            Merci de renseigner au minimum {MINIMUM_CHARS_TO_PERFORM_SEARCH} caractères pour lancer la recherche
          </InputLegend>
          <Divider marginTop="3v" borderBottomColor="grey.300" orientation="horizontal" />
        </Box>
      )}
      {searchTerm.length > 0 && searchResults?.length === 0 && (
        <NoResults title="Il n'y a aucun résultat pour votre recherche sur le territoire sélectionné" />
      )}
      {loading && <Loading />}
      {searchResults?.length > 0 && (
        <FormationsList
          formations={searchResults}
          onFormationClick={onFormationClick}
          selectedValue={filters.formation}
        />
      )}
    </>
  );
};

FormationFilterMenu.propTypes = {
  onFormationClick: PropTypes.func.isRequired,
  filters: filtersPropTypes.state,
};

export default FormationFilterMenu;
