import { Box, Flex, Heading, HStack, Link, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { NAVIGATION_PAGES } from "../../constants/navigationPages";
import { CONTACT_ADDRESS, PRODUCT_NAME } from "../../constants/product";
import Section from "../Section/Section";

const ContactSection = () => {
  return (
    <Section background="galt" paddingY="4w">
      <Heading color="grey.800" as="h2" fontSize="beta">
        Une question ?
      </Heading>
      <Flex marginTop="1w">
        <Stack>
          <Text color="grey.800">
            Le service {PRODUCT_NAME} est porté par la Mission interministérielle pour l’apprentissage. Vous avez besoin
            d’en savoir plus sur les données collectées, les différents types d’accès aux données, etc. Contacter
            l&apos;équipe :{" "}
            <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
              <Text as="span">{CONTACT_ADDRESS}</Text>
            </Link>
          </Text>
          <Link as={NavLink} to={NAVIGATION_PAGES.QuestionsReponses.path} color="bluefrance">
            <HStack>
              <Text>Consulter la page d&apos;aide</Text>
              <Box marginTop="2w" className="ri-arrow-right-line" />
            </HStack>
          </Link>
          <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
            <HStack>
              <Text>Contacter l’équipe</Text>
              <Box marginTop="2w" className="ri-arrow-right-line" />
            </HStack>
          </Link>
        </Stack>
      </Flex>
    </Section>
  );
};

export default ContactSection;
