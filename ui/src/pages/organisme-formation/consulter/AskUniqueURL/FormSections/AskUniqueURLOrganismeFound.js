import { Box, HStack, Stack, Text } from "@chakra-ui/react";

const AskUniqueURLOrganismeFound = () => {
  return (
    <Stack>
      <HStack>
        <Box as="i" className="ri-checkbox-circle-fill" fontSize="40px" marginBottom="6w" color="bluefrance" />
        <Box>
          <Text color="grey.800" fontWeight="bold" fontSize="beta" marginTop="1w">
            Votre organisme transmet bien des données <br /> au Tableau de bord de l’apprentissage.
          </Text>
          <Text marginTop="4w" color="#000000" fontSize="epsilon">
            Utiliser votre URL unique disponible dans votre ERP pour consulter votre page
          </Text>
        </Box>
      </HStack>
    </Stack>
  );
};

export default AskUniqueURLOrganismeFound;
