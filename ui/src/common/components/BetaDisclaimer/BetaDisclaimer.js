import { Box, Flex, Text } from "@chakra-ui/react";
import React from "react";

import Section from "../Section/Section";

const BetaDisclaimer = () => {
  return (
    <Section background="galt" paddingY="4w">
      <Flex>
        <Box
          as="legend"
          paddingX="1w"
          paddingY="1v"
          fontSize="zeta"
          backgroundColor="bluefrance"
          color="white"
          borderRadius="4px"
          marginRight="2w"
        >
          beta
        </Box>
        <Text color="grey.800">
          Cet outil est en construction, pour nous signaler un besoin, une donnée manquante ou une anomalie,
          contactez-nous : tableau-de-bord@apprentissage.beta.gouv.fr
        </Text>
      </Flex>
    </Section>
  );
};

export default BetaDisclaimer;
