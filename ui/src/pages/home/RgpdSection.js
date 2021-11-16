import { Box, Heading, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../common/components";

const RgpdCard = ({ legend, text, backgroundColor }) => {
  return (
    <Box backgroundColor={backgroundColor} paddingX="4w" paddingY="3w" height="180px">
      <Box as="legend" fontSize="epsilon" padding="1w" backgroundColor="white" color={backgroundColor}>
        {legend}
      </Box>
      <Text fontSize="gamma" color="white" marginTop="2w">
        {text}
      </Text>
    </Box>
  );
};

RgpdCard.propTypes = {
  legend: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string.isRequired,
};

const RgpdSection = () => {
  return (
    <Section paddingY="8w">
      <Heading as="h2">Réglement général de protection des données</Heading>
      <HStack spacing="3w" marginTop="3w" fontWeight="700">
        <RgpdCard
          legend="Base légale"
          text="Service fondé sur le principe d'intérêt public"
          backgroundColor="#009081"
        />
        <RgpdCard legend="Finalité" text="Aider les acteurs à piloter l’apprentissage" backgroundColor="#009099" />
        <RgpdCard legend="Principe" text="Respecte le principe de minimisation des données" backgroundColor="#465F9D" />
      </HStack>
    </Section>
  );
};

export default RgpdSection;
