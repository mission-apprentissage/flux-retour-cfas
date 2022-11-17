import { Box, Button, Heading, HStack, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { NavLink } from "react-router-dom";
import { HashLink } from "react-router-hash-link";

import { Section } from "../../components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { PRODUCT_NAME } from "../../common/constants/product";

const currentPage = NAVIGATION_PAGES.DonneesPersonnelles;

const RgpdCard = ({ legend, text, backgroundColor, href }) => {
  return (
    <HashLink to={href}>
      <Box backgroundColor={backgroundColor} width="400px" paddingX="4w" paddingY="3w" height="180px">
        <Box as="legend" fontSize="epsilon" paddingY="1w" paddingX="3v" backgroundColor="white" color={backgroundColor}>
          {legend}
        </Box>
        <Text fontSize="gamma" color="white" marginTop="2w">
          {text}
        </Text>
      </Box>
    </HashLink>
  );
};

RgpdCard.propTypes = {
  href: PropTypes.string.isRequired,
  legend: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string.isRequired,
};

const RgpdSection = (props) => {
  return (
    <Section {...props}>
      <HStack spacing="10w" color="grey.800" alignItems="flex-start" marginBottom="5w">
        <Box flex="1">
          <Heading as="h2" fontSize="alpha">
            {currentPage.title}
          </Heading>
          <Button variant="secondary" to={NAVIGATION_PAGES.DonneesPersonnelles.path} marginTop="2w" as={NavLink}>
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
    </Section>
  );
};

export default RgpdSection;
