import { Box, Heading, HStack, Link, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../common/components";
import { navigationPages } from "../../../common/constants/navigationPages";

const currentPage = navigationPages.DonneesPersonnelles;

const RgpdCard = ({ legend, text, backgroundColor, href }) => {
  return (
    <Link style={{ textDecoration: "none" }} href={href}>
      <Box backgroundColor={backgroundColor} w="400px" paddingX="4w" paddingY="3w" height="180px">
        <Box as="legend" fontSize="epsilon" padding="1w" backgroundColor="white" color={backgroundColor}>
          {legend}
        </Box>
        <Text fontSize="gamma" color="white" marginTop="2w">
          {text}
        </Text>
      </Box>
    </Link>
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
      <Heading as="h1" fontSize="alpha" color="grey.800">
        {currentPage.title}
      </Heading>
      <Text fontSize="epsilon" marginTop="2w" color="grey.800">
        Le Tableau de Bord de l&apos;Apprentissage est construit dans le respect de la vie privée des personnes et
        applique les standards de sécurité de l&apos;Etat.
      </Text>
      <HStack alignItems="center" spacing="4w" marginTop="3w" fontWeight="700">
        <RgpdCard
          legend="Base légale"
          text="La mission d'intérêt public"
          backgroundColor="#009081"
          href={`${currentPage.path}#${currentPage.anchors.missionInteretPublic}`}
        />
        <RgpdCard
          legend="Finalité"
          text="Faciliter le pilotage opérationnel de l’apprentissage"
          backgroundColor="#009099"
          href={`${currentPage.path}#${currentPage.anchors.faciliterPilotage}`}
        />
        <RgpdCard
          legend="Données collectées"
          text="Minimisation des données"
          backgroundColor="#465F9D"
          href={`${currentPage.path}#${currentPage.anchors.minimisationDonnees}`}
        />
      </HStack>
    </Section>
  );
};

export default RgpdSection;
