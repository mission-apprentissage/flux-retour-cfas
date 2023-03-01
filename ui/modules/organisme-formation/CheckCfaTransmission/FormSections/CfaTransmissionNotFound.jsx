import { Box, Button, HStack, Text } from "@chakra-ui/react";
import NavLink from "next/link";

import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";

const CfaTransmissionNotFound = () => {
  return (
    <HStack marginTop="2w">
      <Box as="i" className="ri-close-circle-fill" fontSize="40px" marginBottom="6w" color="bluefrance" />
      <Box>
        <Text color="grey.800" fontWeight="bold" fontSize="beta" marginTop="1w">
          Votre organisme ne transmet pas de données <br />
          au tableau de bord de l’apprentissage.
        </Text>
        <Button
          variant="primary"
          marginTop="2w"
          as={NavLink}
          href={NAVIGATION_PAGES.OrganismeFormation.transmettre.path}
        >
          Voir comment paramétrer la transmission des données
        </Button>
      </Box>
    </HStack>
  );
};

export default CfaTransmissionNotFound;
