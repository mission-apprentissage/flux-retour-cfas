import { Skeleton, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { SearchInput } from "../../../../../common/components";
import { filtersPropTypes } from "../../../FiltersContext";
import FormationsList from "./FormationsList";
import withFormationSearch from "./withFormationSearch";

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

const FormationFilterMenu = ({ filters, searchTerm, loading, searchResults, onSearchTermChange, onFormationClick }) => {
  return (
    <>
      <SearchInput
        value={searchTerm}
        onChange={onSearchTermChange}
        placeholder="Rechercher un libellé de formation ou un CFD"
      />
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
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      cfd: PropTypes.string.isRequired,
      libelle: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onFormationClick: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  filters: filtersPropTypes.state,
};

export default withFormationSearch(FormationFilterMenu);
