import { Box, Divider, Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import InputLegend from "@/components/InputLegend/InputLegend";
import Loading from "@/components/Loading/Loading";
import NoResults from "@/components/NoResults/NoResults";
import SearchInput from "@/components/SearchInput/SearchInput";
import { filtersPropTypes } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

import CfasList from "./CfasList";
import useOrganismeSearch, { MINIMUM_CHARS_TO_PERFORM_SEARCH } from "./useCfaSearch";

const CfaPanel = ({ value, onCfaClick, filters }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, loading } = useOrganismeSearch(searchTerm, filters);

  return (
    <div>
      <Heading as="h3" variant="h3" marginBottom="3w" marginTop="2w">
        Sélectionner un organisme de formation
      </Heading>
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Rechercher le nom d'un organisme de formation, son UAI ou son SIRET"
      />
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
      {searchResults?.length > 0 && <CfasList cfas={searchResults} onCfaClick={onCfaClick} selectedValue={value} />}
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
