import { Box, Divider, Heading, Skeleton, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { InputLegend, SearchInput } from "../../../../../common/components";
import { filtersPropTypes } from "../../../FiltersContext";
import CfasList from "./CfasList";
import useCfaSearch, { MINIMUM_CHARS_TO_PERFORM_SEARCH } from "./useCfaSearch";

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

const CfaPanel = ({ value, onCfaClick, filters }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, loading } = useCfaSearch(searchTerm, filters);

  return (
    <div>
      <Heading as="h3" variant="h3" marginBottom="3w">
        Sélectionner un organisme de formation
      </Heading>
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Rechercher le nom d'un organisme de formation ou son UAI"
      />
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
      <CfasList cfas={searchResults} onCfaClick={onCfaClick} selectedValue={value} />
    </div>
  );
};

CfaPanel.propTypes = {
  onCfaClick: PropTypes.func.isRequired,
  value: PropTypes.shape({
    uai_etablissement: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string.isRequired,
  }),
  filters: filtersPropTypes.state,
};

export default CfaPanel;
