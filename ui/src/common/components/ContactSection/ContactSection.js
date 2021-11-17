import { Flex, Heading, Link, Text } from "@chakra-ui/react";
import React from "react";

import Section from "../Section/Section";

const CONTACT_ADDRESS = "tableau-de-bord@apprentissage.beta.gouv.fr";

const ContactSection = () => {
  return (
    <Section background="galt" paddingY="4w">
      <Heading color="grey.800" as="h2" fontSize="beta">
        Une question ?
      </Heading>
      <Flex marginTop="1w">
        <Text color="grey.800">
          Le service Tableau de bord de l’apprentissage est porté par la Mission interministérielle pour
          l’apprentissage. Vous avez besoin d’en savoir plus sur les données collectées, les différents types d’accès
          aux données, etc. contacter l’équipe&nbsp;:&nbsp;
          <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
            {CONTACT_ADDRESS}
          </Link>
        </Text>
      </Flex>
    </Section>
  );
};

export default ContactSection;
