import { Box, Divider, Flex, HStack, Skeleton, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { PageSectionTitle } from "../../../../../common/components";
import withInfoFormationData from "./withInfoFormationData";

const InfosFormationSection = ({ infosFormation, loading, error }) => {
  if (loading) {
    return (
      <HStack spacing="4w">
        <Skeleton height="2rem" startColor="bluesoft.300" endColor="bluesoft.100" flex="2" />
        <Skeleton height="2rem" startColor="bluesoft.300" endColor="bluesoft.100" flex="1" />
      </HStack>
    );
  }

  if (error) {
    return (
      <Text fontSize="epsilon" color="grey.800">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors de la récupération des informations de la formation
        </Box>
      </Text>
    );
  }

  if (infosFormation) {
    return (
      <Flex justifyContent="space-between">
        <PageSectionTitle>{infosFormation.libelle}</PageSectionTitle>
        <Flex>
          <Divider orientation="vertical" marginRight="4w" />
          <Text fontSize="epsilon" color="grey.600">
            CFD : {infosFormation.cfd}
          </Text>
        </Flex>
      </Flex>
    );
  }

  return null;
};

InfosFormationSection.propTypes = {
  infosFormation: PropTypes.shape({
    libelle: PropTypes.string.isRequired,
    cfd: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default withInfoFormationData(InfosFormationSection);
