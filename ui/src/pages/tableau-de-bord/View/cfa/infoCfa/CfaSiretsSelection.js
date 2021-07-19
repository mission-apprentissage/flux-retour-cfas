import { Box, HStack, Skeleton, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../../common/components";
import SiretsFilter from "../../../Filters/sirets/SiretsFilter";
import { useFiltersContext } from "../../../FiltersContext";

const CfaSiretsSelection = ({ filters, sirets, loading, error }) => {
  const filtersContext = useFiltersContext();
  let content = null;

  if (loading) {
    content = (
      <Section paddingY="2w">
        <HStack>
          <Text color="black" fontSize="delta" fontWeight="400">
            Afficher les indices pour :
          </Text>
          <Skeleton height="3rem" width="150px" />
        </HStack>
      </Section>
    );
  }

  if (error) {
    content = (
      <Text fontSize="epsilon">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors de la récupération des informations de l&apos;organisme de formation
        </Box>
      </Text>
    );
  }

  if (sirets) {
    content = (
      <Section paddingY="2w">
        <Text color="black" fontSize="delta" fontWeight="400">
          Afficher les indices pour : &nbsp;
          <SiretsFilter filters={filters} sirets={sirets} onSiretChange={filtersContext.setters.setSiret} />
        </Text>
      </Section>
    );
  }

  return content;
};

CfaSiretsSelection.propTypes = {
  sirets: PropTypes.arrayOf(PropTypes.string),
};

export default CfaSiretsSelection;
