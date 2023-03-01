import { Box, Flex, HStack, Text } from "@chakra-ui/react";

import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import Link from "../../../../components/Links/Link";

const CfaTransmissionFound = () => {
  return (
    <HStack marginTop="2w">
      <Flex
        as="i"
        className="ri-checkbox-circle-fill"
        alignSelf="start"
        marginTop="1w"
        fontSize="40px"
        color="bluefrance"
      />
      <Box>
        <Text color="grey.800" fontWeight="bold" fontSize="beta" marginTop="1w">
          Votre organisme transmet bien des données <br /> au tableau de bord de l’apprentissage.
        </Text>
        <Text marginTop="4w" color="#000000" fontSize="epsilon">
          Utiliser votre URL unique disponible dans votre ERP pour consulter votre page
        </Text>
        <Link variant="underline" href={NAVIGATION_PAGES.QuestionsReponses.path} marginTop="2w">
          En savoir plus
          <Box as="i" className="ri-arrow-right-line" marginLeft="3v" />
        </Link>
      </Box>
    </HStack>
  );
};

export default CfaTransmissionFound;
