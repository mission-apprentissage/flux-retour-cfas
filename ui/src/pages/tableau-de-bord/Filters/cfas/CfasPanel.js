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
        placeholder="Saisissez le nom d'un établissment ou un UAI"
      />
      <CfasList cfas={searchResults} onCfaClick={onCfaClick} selectedValue={value} />
      {searchResults?.length === 0 && (
        <Text fontSize="zeta" color="gray.500 ">
          Aucun résultat trouvé
        </Text>
      )}
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
