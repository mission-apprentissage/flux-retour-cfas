import React from "react";
import Head from "next/head";
import { Box, Flex, Heading, HStack, Image, Text } from "@chakra-ui/react";
import { NAVIGATION_PAGES } from "../common/constants/navigationPages";
import { PRODUCT_NAME } from "../common/constants/product";
import ApercuDesDonneesSection from "../components/Home/sections/ApercuDesDonneesSection";
import RgpdSection from "../components/Home/sections/RgpdSection";

import LinkCard from "../components/LinkCard/LinkCard";
import { Section, Page } from "../components";

export default function Home() {
  const title = PRODUCT_NAME;
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Section paddingY="4w">
        <Flex pt="2w">
          <Box flex="1">
            <Heading as="h1" fontSize="2.3em" textAlign={["center", "center", "center", "initial"]}>
              Le {PRODUCT_NAME}
            </Heading>
            <Text fontSize="beta" color="grey.800" marginTop="4w" textAlign={["center", "center", "center", "initial"]}>
              Mettre à disposition des <strong>différents acteurs</strong> <br />
              les <strong>données clés</strong> de l&apos;apprentissage en <strong>temps réel</strong>
            </Text>
          </Box>
          <Image
            src="/images/dashboard-illustration.svg"
            alt="illustration tableau de bord"
            paddingBottom="3w"
            display={["none", "none", "none", "none", "inline-block"]}
          />
        </Flex>
        <HStack
          spacing={["0", "0", "0", "0", "3w"]}
          _hover={{ cursor: "pointer" }}
          flexDirection={["column", "column", "column", "column", "row"]}
          alignItems={["normal", "normal", "normal", "normal", "center"]}
          mt={["2w", "2w", "2w", "2w", "0"]}
        >
          <LinkCard linkHref={NAVIGATION_PAGES.Login.path} mb={["2w", "2w", "2w", "2w", "0"]}>
            Vous êtes une{" "}
            <strong>
              institution ou une organisation <br />
              professionnelle{" "}
            </strong>
            (OPCO, branche, etc...)
          </LinkCard>
          <LinkCard linkHref={NAVIGATION_PAGES.Login.path}>
            Vous êtes un{" "}
            <strong>
              organisme de formation <br />
              en apprentissage
            </strong>
          </LinkCard>
        </HStack>
      </Section>
      <ApercuDesDonneesSection /> {/* TODO to add later outside page container to make it full width */}
      <RgpdSection marginTop="6w" />
    </Page>
  );
}
