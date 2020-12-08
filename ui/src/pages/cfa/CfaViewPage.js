import { Box, Center, Heading, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import PageSectionTitle from "../../common/components/PageSectionTitle";
import StatCard from "../../common/components/StatCard";
import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../common/constants/statutsColors";

const CfaViewPage = () => {
  return (
    <>
      <Box>
        <Heading fontFamily="Marianne" fontSize="delta" color="grey.800" as="h2">
          Dashboard de l&apos;apprentissage
        </Heading>
        <Heading fontSize="alpha" fontWeight="400" as="h1" mb="1v" mt="9w">
          Institut de la vigne et du vin
        </Heading>
        <Text fontSize="delta" color="grey.800">
          24 av. du Prado, 13006 Marseille
        </Text>
        <Box mt="9w">
          <PageSectionTitle>Vue générale : le mois dernier</PageSectionTitle>
          <HStack mt="3w">
            <StatCard background="bluefrance" label="conversion" stat="87%" />
          </HStack>
          <HStack spacing="2w" mt="3w">
            <StatCard
              background="bluesoft.200"
              color="grey.800"
              indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.prospects}
              label="prospects"
              stat="226"
            />
            <StatCard
              background="yellowmedium.200"
              color="grey.800"
              indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.inscrits}
              label="inscrits"
              stat="40"
            />
            <StatCard
              background="orangemedium.200"
              color="grey.800"
              indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.apprentis}
              label="apprentis"
              stat="634"
            />
            <StatCard
              background="orangesoft.200"
              color="grey.800"
              indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.abandons}
              label="abandons"
              stat="123"
            />
          </HStack>
        </Box>
      </Box>
      <Box mt="9w">
        <PageSectionTitle>Statuts des jeunes</PageSectionTitle>
        <Center mt="3w" width="90%" height="12.5rem" background="grey.200" color="grey.500">
          Histogramme ici
        </Center>
      </Box>
      <Box mt="9w">
        <PageSectionTitle>Pilotage des formations</PageSectionTitle>
        <Center mt="3w" width="90%" height="12.5rem" background="grey.200" color="grey.500">
          Liste d&apos;indicateurs ici
        </Center>
      </Box>
    </>
  );
};

CfaViewPage.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CfaViewPage;
