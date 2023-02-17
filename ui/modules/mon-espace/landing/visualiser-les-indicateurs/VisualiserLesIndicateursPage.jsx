import { Heading, Text } from "@chakra-ui/react";
import React from "react";

import BreadcrumbNav from "@/components/BreadcrumbNav/BreadcrumbNav";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import { NAVIGATION_PAGES } from "@/common/constants/navigationPages";
import ViewSelection from "./ViewSelection";

const VisualiserLesIndicateursPage = () => {
  return (
    <Page>
      <Section paddingY="3w">
        <BreadcrumbNav links={[NAVIGATION_PAGES.VisualiserLesIndicateurs]} />
        <Heading as="h1" marginTop="4w">
          {NAVIGATION_PAGES.VisualiserLesIndicateurs.title}
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
