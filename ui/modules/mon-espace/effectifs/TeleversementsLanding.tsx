import { Box, Button, Flex, Heading, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";

import Ribbons from "@/components/Ribbons/Ribbons";
import { ArrowDropRightLine } from "@/theme/components/icons";

const TeleversementsLanding = ({ importUrl }: { importUrl: string }) => {
  return (
    <Flex alignItems="flex-start" flexDirection="column" gap={6}>
      <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
        Importer votre fichier pour transmettre ou ajouter des effectifs.
      </Heading>

      <Ribbons variant="info" mb={6}>
        <Box mx={3}>
          <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
            Service d’import de vos effectifs en version bêta.
          </Text>
          <Text color="grey.800" mt={4} textStyle="sm">
            Ce service est en cours de refonte, nous travaillons actuellement à le rendre pleinement fonctionnel.
            <br />
            Si vous constatez un dysfonctionnement lors de son utilisation, cela signifie que votre fichier ne peut pas
            être pris en charge pour le moment.
            <br />
            Nous vous prions de bien vouloir nous excuser pour l’éventuel désagrément rencontré et vous remercions de
            votre patience.
          </Text>
        </Box>
      </Ribbons>

      <Button as={NextLink} href={importUrl} size={"md"} variant="primary">
        Importer un fichier
        <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
      </Button>
      <div>
        <Text>Vous n&rsquo;avez pas de fichier ? Utilisez notre fichier modèle.</Text>
        <Link href={"/modele_tableau_de_bord.csv"} textDecoration={"underline"} isExternal>
          <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} ml="0.5rem" /> Télécharger le fichier modèle tableau de bord
        </Link>
      </div>
    </Flex>
  );
};

export default TeleversementsLanding;
