import { Box, Container, Image, Text } from "@chakra-ui/react";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { getOrganisationLabel } from "@/common/internal/Organisation";
import Link from "@/components/Links/Link";
import useAuth from "@/hooks/useAuth";

const SuggestFeature = () => {
  const { auth } = useAuth();

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
          Contribuer à l’évolution du Tableau de Bord
        </Text>
        <Text mt={4}>
          Aidez-nous à faire évoluer le Tableau de Bord en proposant de nouvelles fonctionnalités, informations à
          afficher ou en proposant des améliorations sur l’existant.
        </Text>
        <Link
          variant="blueBg"
          mt="6"
          display="inline-flex"
          alignItems="center"
          href={`mailto:${CONTACT_ADDRESS}?subject=Suggestion de fonctionnalité ou besoin exprimé sur TDB [${getOrganisationLabel(
            auth.organisation
          )}]`}
          target="_blank"
          rel="noopener noreferrer"
          isExternal
        >
          <Box as="i" className="ri-send-plane-fill" verticalAlign="middle" marginRight="1w" />
          Envoyer un courriel
        </Link>
      </Box>
      <Image src="/images/teamSolid0.svg" w="200px" alt="Graphique tableau de bord" flex="1" userSelect="none" />
    </Container>
  );
};

export default SuggestFeature;
