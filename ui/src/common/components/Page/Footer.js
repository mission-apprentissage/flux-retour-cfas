import { Box, Flex, HStack, Link, Stack, StackDivider, Text } from "@chakra-ui/react";
import React from "react";

import { NAVIGATION_PAGES } from "../../constants/navigationPages";
import { Logo } from "..";
import Section from "../Section/Section";

const Footer = () => (
  <footer>
    <Section borderTopWidth="2px" borderTopColor="bluefrance" background="white" paddingY="4w">
      <Flex justifyContent="space-between" paddingX="5w">
        <Logo scale={1.5} />
        <Stack fontSize="zeta" color="grey.600" spacing="3w">
          <HStack spacing="3w" fontWeight="700">
            <Link target="_blank" href="https://www.legifrance.gouv.fr/">
              legifrance.gouv.fr
            </Link>
            <Link target="_blank" href="https://www.gouvernement.fr/">
              gouvernement.fr
            </Link>
            <Link target="_blank" href="https://www.service-public.fr/">
              service-public.fr
            </Link>
            <Link target="_blank" href="https://www.data.gouv.fr/fr/">
              data.gouv.fr
            </Link>
          </HStack>
        </Stack>
      </Flex>
    </Section>
    <Section
      borderTopWidth="1px"
      fontSize="omega"
      color="grey.500"
      borderTopColor="grey.200"
      background="white"
      paddingY="2w"
    >
      <HStack divider={<StackDivider borderColor="grey.200" />} spacing="3w">
        <Link href="#">Plan du site</Link>
        <Link href={NAVIGATION_PAGES.Statistiques.path}>{NAVIGATION_PAGES.Statistiques.title}</Link>
        <Link href="https://dashlord.incubateur.net/url/cfas-apprentissage-beta-gouv-fr/" target="_blank">
          Accessibilité : Non conforme <Box as="i" marginBottom="2w" className="ri-external-link-line" />
        </Link>
        <Link href={NAVIGATION_PAGES.MentionsLegales.path}>{NAVIGATION_PAGES.MentionsLegales.title}</Link>
        <Link href={NAVIGATION_PAGES.PolitiqueDeConfidentialite.path}>Politique de confidentialité</Link>
        <Link href={NAVIGATION_PAGES.CGU.path}>Conditions générales d&apos;utilisation</Link>
        <Link href={NAVIGATION_PAGES.QuestionsReponses.path}>Page d&apos;aide</Link>
      </HStack>
      <Text marginTop="3w">
        Sauf mention contraire, tous les contenus de ce site sont sous &nbsp;
        <Link
          textDecoration="underline"
          href="https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf"
        >
          license etalab-2.0 <Box as="i" marginBottom="2w" className="ri-external-link-line" />
        </Link>
      </Text>
    </Section>
  </footer>
);

export default Footer;
