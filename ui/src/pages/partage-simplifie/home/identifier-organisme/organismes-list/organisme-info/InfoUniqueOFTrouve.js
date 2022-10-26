import { Box, HStack, Link, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

import { REFERENTIEL_URL } from "../../../../../../common/constants/productPartageSimplifie.js";

const InfoUniqueOFTrouve = ({ uai }) => (
  <Box width="70%" border="1px solid" borderColor="bluefrance" padding="4w" marginTop="6w">
    <Stack spacing="2w">
      <HStack>
        <Box as="i" color="bluefrance" fontSize="alpha" className="ri-account-circle-fill" marginRight="2w" />
        <Text fontSize="beta" color="grey.800" fontWeight="bold">
          N° UAI de votre organisme : {uai}
        </Text>
      </HStack>
      <HStack>
        <Box as="i" color="#0D6635" fontSize="alpha" className="ri-checkbox-circle-fill" marginRight="2w" />
        <Text fontSize="delta" color="#0D6635" fontWeight="bold" marginTop="2w">
          Nous avons pu identifier votre UAI dans le{" "}
          <Link target="_blank" rel="noopener noreferrer" href={REFERENTIEL_URL} fontWeight="700" color="bluefrance">
            référentiel des organismes de formation
          </Link>{" "}
          : vérifiez les informations associés à cet UAI et finalisez la création de votre compte.
        </Text>
      </HStack>
    </Stack>
  </Box>
);

InfoUniqueOFTrouve.propTypes = {
  uai: PropTypes.string.isRequired,
};

export default InfoUniqueOFTrouve;
