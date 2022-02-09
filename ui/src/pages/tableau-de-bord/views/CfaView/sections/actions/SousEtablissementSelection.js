import { Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../FiltersContext";
import SousEtablissementFilter from "./SousEtablissementFilter/SousEtablissementFilter";

const SousEtablissementSelection = ({ sousEtablissements }) => {
  const filtersContext = useFiltersContext();

  return (
    <Flex alignItems="center">
      <Text color="grey.800" fontSize="delta">
        Afficher les indices pour :&nbsp;
      </Text>
      <SousEtablissementFilter
        sousEtablissements={sousEtablissements}
        value={filtersContext.state.sousEtablissement}
        onSousEtablissementChange={filtersContext.setters.setSousEtablissement}
      />
    </Flex>
  );
};

SousEtablissementSelection.propTypes = {
  sousEtablissements: PropTypes.arrayOf(
    PropTypes.shape({
      siret_etablisement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string,
    })
  ),
};

export default SousEtablissementSelection;
