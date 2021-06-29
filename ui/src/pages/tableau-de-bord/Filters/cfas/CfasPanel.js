import { Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { SearchInput } from "../../../../common/components";
import CfasList from "./CfasList";
import withCfaSearch from "./withCfaSearch";

const CfaPanel = ({ value, onCfaClick, searchTerm, onSearchTermChange, searchResults }) => {
  return (
    <div>
      <SearchInput
        value={searchTerm}
        onChange={onSearchTermChange}
        placeholder="Rerchercher le nom d'un organisme de formation, un UAI ou un SIRET"
      />
      {searchResults?.length === 0 && (
        <Text color="grey.800" fontWeight="700" paddingTop="2w" paddingLeft="1w">
          Il n&apos;y a aucun résultat pour votre recherche sur le territoire sélectionné
        </Text>
      )}
      <CfasList cfas={searchResults} onCfaClick={onCfaClick} selectedValue={value} />
    </div>
  );
};

CfaPanel.propTypes = {
  onCfaClick: PropTypes.func.isRequired,
  value: PropTypes.shape({
    siret_etablissement: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string.isRequired,
  }),
  onSearchTermChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      siret_etablissement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string.isRequired,
    })
  ),
};

export default withCfaSearch(CfaPanel);
