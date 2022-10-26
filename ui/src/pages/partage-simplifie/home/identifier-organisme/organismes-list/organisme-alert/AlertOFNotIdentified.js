import { Box, HStack, Link, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

import { CONTACT_ADDRESS } from "../../../../../../common/constants/productPartageSimplifie.js";

const AlertOFNotIdentified = ({ uai }) => (
  <Box width="70%" border="1px solid" borderColor="bluefrance" padding="4w" marginTop="6w">
    <Stack spacing="2w">
      <HStack>
        <Box as="i" color="bluefrance" fontSize="alpha" className="ri-account-circle-fill" marginRight="2w" />
        <Text fontSize="beta" color="grey.800" fontWeight="bold">
          N° UAI de votre organisme : {uai}
        </Text>
      </HStack>
      <HStack>
        <Box as="i" color="#B60000" fontSize="alpha" className="ri-close-circle-fill" marginRight="2w" />
        <Text fontSize="delta" color="#B60000" fontWeight="bold" marginTop="2w">
          Vous n’identifiez pas votre organisme. Veuillez vous rapprocher du support du Tableau de bord en écrivant à{" "}
          <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
            {CONTACT_ADDRESS}
          </Link>
        </Text>
      </HStack>
    </Stack>
  </Box>
);

AlertOFNotIdentified.propTypes = {
  uai: PropTypes.string.isRequired,
};

export default AlertOFNotIdentified;
