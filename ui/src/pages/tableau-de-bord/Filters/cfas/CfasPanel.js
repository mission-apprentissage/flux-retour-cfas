import { Skeleton, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { SearchInput } from "../../../../common/components";
import CfasList from "./CfasList";
import withCfaSearch from "./withCfaSearch";

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

const CfaPanel = ({ value, loading, onCfaClick, searchTerm, onSearchTermChange, searchResults }) => {
  return (
    <div>
      <SearchInput
        value={searchTerm}
        onChange={onSearchTermChange}
        placeholder="Rechercher le nom d'un organisme de formation ou son UAI"
      />
      {searchResults?.length === 0 && (
        <Text color="grey.800" fontWeight="700" paddingTop="2w" paddingLeft="1w">
          Il n&apos;y a aucun résultat pour votre recherche sur le territoire sélectionné
        </Text>
      )}
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
  onSearchTermChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      uai_etablissement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string.isRequired,
    })
  ),
};

export default withCfaSearch(CfaPanel);
