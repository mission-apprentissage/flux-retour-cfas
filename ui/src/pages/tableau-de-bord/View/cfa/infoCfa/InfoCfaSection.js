import { Box, Divider, Flex, HStack, Skeleton, Stack, Tag, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { PageSectionTitle } from "../../../../../common/components";
import withInfoCfaData from "./withInfoCfaData";

const InfoCfaSection = ({ infosCfa, loading, error }) => {
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
          Erreur lors de la récupération des informations du CFA
        </Box>
      </Text>
    );
  }

  if (infosCfa) {
    return (
      <Flex>
        <Box flex="2">
          <Stack spacing="8px">
            {/* Nom cfa */}
            <PageSectionTitle>{infosCfa.libelleLong}</PageSectionTitle>

            {/* Réseaux cfa */}
            {infosCfa.reseaux.map((item, i) => (
              <HStack key={i}>
                <i className="ri-community-fill"></i>
                <span>{item}</span>
              </HStack>
            ))}

            {/* Domaines métiers cfa */}
            <HStack mt="2">
              {infosCfa.domainesMetiers.map((item, i) => (
                <Tag
                  key={i}
                  background="orangesoft.200"
                  pl="1w"
                  pr="1w"
                  borderRadius="7%"
                  fontWeight="700"
                  color="bluefrance"
                >
                  {item}
                </Tag>
              ))}
            </HStack>
          </Stack>
        </Box>
        <Box>
          <Divider orientation="vertical" />
        </Box>
        <Box flex="1" ml="5" space>
          {/* Uai & Adresse Cfa */}
          <Stack spacing="24px">
            <Text fontSize="epsilon" color="grey.600">
              UAI : {infosCfa.uai}
            </Text>
            <Text fontSize="epsilon" color="grey.600">
              SIRET : {infosCfa.siret}
            </Text>
            <Text fontSize="epsilon" color="grey.800">
              {infosCfa.adresse}
            </Text>
          </Stack>
        </Box>
      </Flex>
    );
  }

  return null;
};

InfoCfaSection.propTypes = {
  infosCfa: PropTypes.shape({
    siret: PropTypes.string.isRequired,
    libelleLong: PropTypes.string.isRequired,
    reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
    domainesMetiers: PropTypes.arrayOf(PropTypes.string).isRequired,
    uai: PropTypes.string.isRequired,
    adresse: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default withInfoCfaData(InfoCfaSection);
