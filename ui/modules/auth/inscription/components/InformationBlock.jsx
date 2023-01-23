import React from "react";
import { Box, Text, UnorderedList, ListItem } from "@chakra-ui/react";

const InformationBlock = (props) => (
  <Box {...props}>
    <Text fontWeight={700} fontSize={22}>
      Votre compte dédié
    </Text>
    <Text mt="2w" fontWeight={700}>
      Le service tableau de bord de l&apos;apprentissage est porté par la Mission interministérielle pour
      l’apprentissage.
    </Text>
    <Text mt="2w">Il permet de :</Text>
    <UnorderedList ml="4w" mt="2w">
      <ListItem>Faciliter le pilotage des politiques publiques</ListItem>
      <ListItem>Accompagner les jeunes en situation de décrochage</ListItem>
      <ListItem>Simplifier les déclarations des organismes de formation auprès des pouvoirs publics</ListItem>
    </UnorderedList>
  </Box>
);

export default InformationBlock;
