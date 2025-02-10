import { Box, Container, Image, Text, Link } from "@chakra-ui/react";
import { AUTRE_AMELIORATION_ELEMENT_LINK } from "shared";

const SuggestFeature = () => {
  return (
    <Container
      maxW="xl"
      bg="#F5F5FE"
      px="14"
      py="10"
      my="20"
      display="flex"
      alignItems="center"
      gap="16"
      flexDirection={["column-reverse", "column-reverse", "column-reverse", "row"]}
    >
      <Box flex="6">
        <Text fontWeight="bold" color="black" fontSize="gamma">
          Contribuer à l’évolution du Tableau de bord de l’apprentissage
        </Text>
        <Text mt={4}>
          Le Tableau de bord se veut être l’instrument de votre pilotage - vous voulez voir une fonctionnalité sur votre
          tableau qui n’existe pas encore, écrivez-nous&nbsp;!
        </Text>
        <Link
          variant="blueBg"
          mt="6"
          display="inline-flex"
          alignItems="center"
          href={AUTRE_AMELIORATION_ELEMENT_LINK}
          isExternal
        >
          <Box as="i" className="ri-send-plane-fill" verticalAlign="middle" marginRight="1w" />
          Nous écrire
        </Link>
      </Box>
      <Image src="/images/teamSolid0.svg" w="200px" alt="Graphique tableau de bord" flex="1" userSelect="none" />
    </Container>
  );
};

export default SuggestFeature;
