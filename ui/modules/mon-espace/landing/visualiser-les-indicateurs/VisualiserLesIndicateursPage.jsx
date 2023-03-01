import { Heading, Text } from "@chakra-ui/react";
import React from "react";

import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import { NAVIGATION_PAGES } from "@/common/constants/navigationPages";
import ViewSelection from "./ViewSelection";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";

const VisualiserLesIndicateursPage = () => {
  return (
    <Page>
      <Section paddingY="3w">
        <Breadcrumb pages={[NAVIGATION_PAGES.MonTableauDeBord]} />
        <Heading as="h1" marginTop="4w">
          {NAVIGATION_PAGES.MonTableauDeBord.title}
        </Heading>
        <Text marginTop="3v" fontSize="gamma" color="grey.800">
          Quelle vue souhaitez-vous afficher ?
        </Text>
        <ViewSelection />
      </Section>
    </Page>
  );
};

export default VisualiserLesIndicateursPage;
