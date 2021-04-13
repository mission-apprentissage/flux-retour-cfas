import { Box, Center, Flex, HStack, Text } from "@chakra-ui/layout";
import { Skeleton } from "@chakra-ui/skeleton";
import PropTypes from "prop-types";
import React from "react";

import { getRoundedPercentage } from "../../../../../common/utils/calculUtils";
import withRegionConversionData from "./withRegionConversionData";

const RegionConversionSection = ({ regionConversionData, error, loading }) => {
  return (
    <>
      {/* Error */}
      {error && !loading && (
        <Center mb={12} height="40px" background="orangesoft.200">
          <HStack fontSize="epsilon">
            <i className="ri-error-warning-fill"></i>
            <Text>Erreur - Impossible de charger la conversion de cette région</Text>
          </HStack>
        </Center>
      )}

      {/* No Data */}
      {!regionConversionData && !error && !loading && (
        <Center mb={12} height="40px" background="orangesoft.200">
          <HStack fontSize="epsilon">
            <i className="ri-error-warning-fill"></i>
            <Text>Aucune information disponible</Text>
          </HStack>
        </Center>
      )}

      {/* Loading */}
      {loading && !error && <Skeleton mb={12} height="40px" />}

      {/* Data */}
      {regionConversionData && !error && !loading && (
        <Flex mb={12} justifyContent="space-between">
          <Text color="grey.800">
            <Box as="span" verticalAlign="middle">
              <HStack>
                <Text>Couverture des indices :</Text>
                <Text as="b" mr={2}>
                  {getRoundedPercentage(regionConversionData.nbCfaConnected, regionConversionData.nbCfaIdentified)}%
                </Text>
                <Text textColor="grey.600">{regionConversionData.nbCfaIdentified} CFAs en France</Text>
                <Text mb={-1} textColor="grey.600" as="b">
                  <i className="ri-arrow-right-s-line"></i>
                </Text>
                <Text textColor="grey.600">
                  {regionConversionData.nbCfaConnected} CFAs sont connectés au tableau de bord
                </Text>
                <Text mb={-1} textColor="grey.600" as="b">
                  {" "}
                  <i className="ri-arrow-right-s-line"></i>
                </Text>
                <Text textColor="grey.600">{regionConversionData.nbCfaDataValidated} CFAs ont validé les indices</Text>
              </HStack>
            </Box>
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
