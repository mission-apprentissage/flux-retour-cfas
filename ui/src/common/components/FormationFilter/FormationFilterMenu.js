import { Box, Divider, Heading, Skeleton, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { filtersPropTypes } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import InputLegend from "../InputLegend/InputLegend";
import SearchInput from "../SearchInput/SearchInput";
import FormationsList from "./FormationsList";
import useFormationSearch, { MINIMUM_CHARS_TO_PERFORM_SEARCH } from "./useFormationSearch";

const NoResults = () => {
  return (
    <Text color="grey.800" fontWeight="700" paddingTop="2w" paddingLeft="1w">
      Il n&apos;y a aucun résultat pour votre recherche sur le territoire sélectionné
    </Text>
  );
};

const Loading = () => {
  return (
    <Stack spacing="2w" paddingLeft="1w" marginTop="2w">
      <Skeleton startColor="grey.200" endColor="grey.600" width="30rem" height="1rem" />;
      <Skeleton startColor="grey.200" endColor="grey.600" width="30rem" height="1rem" />;
      <Skeleton startColor="grey.200" endColor="grey.600" width="30rem" height="1rem" />;
      <Skeleton startColor="grey.200" endColor="grey.600" width="30rem" height="1rem" />;
      <Skeleton startColor="grey.200" endColor="grey.600" width="30rem" height="1rem" />;
    </Stack>
  );
};

const FormationFilterMenu = ({ filters, onFormationClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, loading } = useFormationSearch(searchTerm, filters);

  return (
    <>
      <Heading as="h3" variant="h3" marginBottom="3w">
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
      {searchResults?.length === 0 && <NoResults />}
      {loading && <Loading />}
      <FormationsList
        formations={searchResults}
        onFormationClick={onFormationClick}
        selectedValue={filters.formation}
      />
    </>
  );
};

FormationFilterMenu.propTypes = {
  onFormationClick: PropTypes.func.isRequired,
  filters: filtersPropTypes.state,
};

export default FormationFilterMenu;
