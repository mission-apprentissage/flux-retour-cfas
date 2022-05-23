import { Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

import { NAVIGATION_PAGES } from "../../../../../common/constants/navigationPages";

const AskUniqueURLOrganismeNotFound = () => {
  return (
    <Stack>
      <HStack>
        <Box as="i" className="ri-close-circle-fill" fontSize="40px" marginBottom="6w" color="bluefrance" />
        <Box>
          <Text color="grey.800" fontWeight="bold" fontSize="beta" marginTop="1w">
            Votre organisme ne transmet pas de données <br />
            au Tableau de bord de l’apprentissage.
          </Text>
          <Button
            variant="primary"
            marginTop="2w"
            as={NavLink}
            to={NAVIGATION_PAGES.OrganismeFormation.transmettre.path}
          >
            Voir comment paramétrer la transmission des données
          </Button>
        </Box>
      </HStack>
    </Stack>
  );
};

export default AskUniqueURLOrganismeNotFound;
