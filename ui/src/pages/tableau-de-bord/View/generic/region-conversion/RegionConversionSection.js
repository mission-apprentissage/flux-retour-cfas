import { Box, Center, Flex, HStack, Text } from "@chakra-ui/layout";
import { Skeleton } from "@chakra-ui/skeleton";
import PropTypes from "prop-types";
import React from "react";

import withRegionConversionData from "./withRegionConversionData";

const RegionConversionSection = ({ regionConversionData, error, loading }) => {
  return (
    <>
      {/* Error */}
      {error && !loading && (
        <Center mb="6w" height="40px" background="orangesoft.200">
          <HStack fontSize="epsilon">
            <i className="ri-error-warning-fill"></i>
            <Text>Erreur - Impossible de charger la conversion de cette région</Text>
          </HStack>
        </Center>
      )}

      {/* No Data */}
      {!regionConversionData && !error && !loading && (
        <Center mb="6w" height="40px" background="orangesoft.200">
          <HStack fontSize="epsilon">
            <i className="ri-error-warning-fill"></i>
            <Text>Aucune information disponible</Text>
          </HStack>
        </Center>
      )}

      {/* Loading */}
      {loading && !error && <Skeleton mb="6w" height="40px" />}

      {/* Data */}
      {regionConversionData && !error && !loading && (
        <Flex mb="6w" justifyContent="space-between" alignItems="flex-start" as="section">
          <Text color="grey.800">Couverture des indices sur le territoire sélectionné :</Text>
          <Text color="grey.600">
            {regionConversionData.nbCfaConnected} organismes de formation transmettent leurs données au tableau de bord
          </Text>
          <Box color="grey.600" fontWeight="bold" as="i" className="ri-arrow-right-s-line" marginX="1w" />
          <Text color="grey.600">
            {regionConversionData.nbCfaDataValidated} organismes de formation ont validé leurs données
          </Text>
        </Flex>
      )}
    </>
  );
};

RegionConversionSection.propTypes = {
  regionConversionData: PropTypes.shape({
    nbCfaIdentified: PropTypes.number.isRequired,
    nbCfaConnected: PropTypes.number.isRequired,
    nbCfaDataValidated: PropTypes.number.isRequired,
  }),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
};

export default withRegionConversionData(RegionConversionSection);
