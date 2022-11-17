import { Box, Button, Container, Heading, HStack, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import NavLink from "next/link";
import React from "react";

import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import { PRODUCT_NAME } from "../../../common/constants/product";

const currentPage = NAVIGATION_PAGES.DonneesPersonnelles;

const RgpdSection = (props) => {
  return (
    <Box {...props} w="100%" pt={[4, 8]} px={[1, 1, 6, 8]}>
      <Container maxWidth="xl">
        <HStack
          color="grey.800"
          marginBottom="5w"
          spacing={["0", "0", "5w"]}
          flexDirection={["column", "column", "row"]}
          alignItems={["normal", "normal", "flex-start"]}
        >
          <Box flex="1">
            <Heading as="h2" fontSize="1.9em">
              {currentPage.title}
            </Heading>
            <Button variant="secondary" href={NAVIGATION_PAGES.DonneesPersonnelles.path} marginTop="2w" as={NavLink}>
              En savoir plus
            </Button>
          </Box>
          <Box flex="2">
            <Text fontSize="gamma">
              Le {PRODUCT_NAME} est construit dans le <strong>respect de la vie privée des personnes</strong> et{" "}
              <strong>applique les standards de sécurité de l&apos;Etat</strong>. Il est construit selon trois grands
              principes :
            </Text>
            <UnorderedList paddingY="3w" marginLeft="3w" fontSize="gamma">
              <ListItem>
                il s&apos;agit d&apos;une <strong>mission d&apos;intérêt public </strong>(base légale)
              </ListItem>
              <ListItem>
                il a pour finalité de <strong>faciliter le pilotage opérationnel de l&apos;apprentissage</strong>
              </ListItem>
              <ListItem>
                il collecte ses données selon le principe de <strong>minimisation des données</strong>
              </ListItem>
            </UnorderedList>
          </Box>
        </HStack>
      </Container>
    </Box>
  );
};

export default RgpdSection;
