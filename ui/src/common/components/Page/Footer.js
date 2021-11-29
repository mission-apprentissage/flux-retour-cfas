import { Box, Flex, HStack, Link, Stack, StackDivider, Text } from "@chakra-ui/react";
import React from "react";

import { Logo } from "..";
import Section from "../Section/Section";

const Footer = () => (
  <>
    <Section borderTopWidth="2px" borderTopColor="bluefrance" background="white" paddingY="4w">
      <Flex justifyContent="space-between">
        <Box marginLeft="5w">
          <Logo scale={1.5} />
        </Box>
        <Box w="50%" marginRight="6w">
          <Stack fontSize="zeta" color="gray.600" spacing="3w">
            <Text>Texte optionnel 3 lignes maximum.</Text>
            <Text>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </Text>
            <HStack spacing="3w" fontWeight="700">
              <Link href="#">legifrance.gouv.fr</Link>
              <Link href="#">gouvernement.fr</Link>
              <Link href="#">service-public.fr</Link>
              <Link href="#">data.gouv.fr</Link>
            </HStack>
          </Stack>
        </Box>
      </Flex>
    </Section>
    <Section
      borderTopWidth="1px"
      fontSize="omega"
      color="gray.500"
      borderTopColor="gray.200"
      background="white"
      paddingY="2w"
    >
      <HStack divider={<StackDivider borderColor="gray.200" />} spacing="3w">
        <Link href="#">Plan du site</Link>
        <Link href="#">Accessibilité</Link>
        <Link href="#">Mentions légales</Link>
        <Link href="#">Données personnelles</Link>
        <Link href="#">Gestion des cookies</Link>
      </HStack>
      <Text marginTop="3w">
        Sauf mention contraire, tous les contenus de ce site sont sous &nbsp;
        <Link
          textDecoration="underline"
          href="https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf"
        >
          license etalab-2.0 <Box as="i" marginBottom="2w" className="ri-external-link-line"></Box>
        </Link>
      </Text>
    </Section>
  </>
);

export default Footer;
