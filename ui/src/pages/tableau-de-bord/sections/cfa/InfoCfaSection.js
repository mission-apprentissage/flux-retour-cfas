import { Box, Center, Divider, Flex, HStack, Skeleton, Stack, Tag, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import PageSectionTitle from "../../../../common/components/Page/PageSectionTitle";

const InfoCfaSection = ({ infosCfa = null, loading, error }) => (
  <>
    {/* No Data  */}
    {!infosCfa && !error && (
      <Center h="100px" p={4} background="orangesoft.200">
        <HStack fontSize="gamma">
          <i className="ri-error-warning-fill"></i>
          <Text>Aucune information disponible</Text>
        </HStack>
      </Center>
    )}

    {/* Error  */}
    {error && (
      <Center h="100px" p={4} background="orangesoft.200">
        <HStack fontSize="gamma">
          <i className="ri-error-warning-fill"></i>
          <Text>Erreur - merci de contacter un administrateur</Text>
        </HStack>
      </Center>
    )}

    {/* Loading  */}
    {loading && (
      <Flex>
        <Skeleton flex="2" h="100px" p={4} />
        <Box>
          <Divider orientation="vertical" />
        </Box>
        <Skeleton flex="1" ml="5" />
      </Flex>
    )}

    {/* Data  */}
    {infosCfa && !loading && !error && (
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
            <Text fontSize="epsilon" color="grey.800">
              {infosCfa.adresse}
            </Text>
          </Stack>
        </Box>
      </Flex>
    )}
  </>
);

InfoCfaSection.propTypes = {
  infosCfa: PropTypes.shape({
    libelleLong: PropTypes.string.isRequired,
    reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
    domainesMetiers: PropTypes.arrayOf(PropTypes.string).isRequired,
    uai: PropTypes.string.isRequired,
    adresse: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default InfoCfaSection;
