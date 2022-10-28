import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

const SituationOrganisme = ({ uai, adresse }) => {
  return (
    <Box width="70%" border="1px solid" borderColor="bluefrance" padding="4w" marginTop="6w">
      <Stack spacing="2w">
        <Heading color="bluefrance" fontSize="gamma">
          La situation de votre organisme de formation :
        </Heading>
        <HStack>
          <Box as="i" color="bluefrance" fontSize="alpha" className="ri-account-circle-fill" marginRight="2w" />
          <Text fontSize="beta" color="grey.800" fontWeight="bold" marginTop="2w">
            N° UAI responsable : {uai}
          </Text>
        </HStack>

        <HStack>
          <Box as="i" color="bluefrance" fontSize="alpha" className="ri-account-circle-fill" marginRight="2w" />
          <Text fontSize="beta" color="grey.800" fontWeight="bold" marginTop="2w">
            Les informations de votre organisme :
          </Text>
        </HStack>
        <Stack fontSize="epsilon" color="grey.800" marginTop="2w" spacing="0.5w">
          <Text>{adresse || "NC"}</Text>
        </Stack>
      </Stack>
    </Box>
  );
};

SituationOrganisme.propTypes = {
  uai: PropTypes.string.isRequired,
  adresse: PropTypes.string.isRequired,
};

export default SituationOrganisme;
