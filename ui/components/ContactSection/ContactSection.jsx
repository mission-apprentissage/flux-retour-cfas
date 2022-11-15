import { Flex, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import React from "react";
import Link from "../Links/Link";

import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { CONTACT_ADDRESS, PRODUCT_NAME } from "../../common/constants/product";
import Section from "../Section/Section";
import { RightLine } from "../../theme/components/icons";

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
            d’en savoir plus sur les données collectées, les différents types d’accès aux données, etc...
          </Text>
          <Link href={NAVIGATION_PAGES.QuestionsReponses.path} color="bluefrance" whiteSpace="nowrap">
            <HStack>
              <Text>Consulter la page d&apos;aide</Text>
              <RightLine boxSize={3} />
            </HStack>
          </Link>
          <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
            <HStack>
              <Text>Contacter l’équipe {CONTACT_ADDRESS}</Text>
              <RightLine boxSize={3} />
            </HStack>
          </Link>
        </Stack>
      </Flex>
    </Section>
  );
};

export default ContactSection;
