import React from "react";
import NextLink from "next/link";
import { Button, Flex, Heading, Link, Text } from "@chakra-ui/react";

import { ArrowDropRightLine } from "@/theme/components/icons";

const TeleversementsLanding = ({ importUrl }: { importUrl: string }) => {
  return (
    <Flex alignItems="flex-start" flexDirection="column" gap={6}>
      <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
        Importer votre fichier pour transmettre ou ajouter des effectifs.
      </Heading>
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
