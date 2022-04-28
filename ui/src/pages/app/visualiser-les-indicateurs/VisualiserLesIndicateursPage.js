import { Heading, HStack, Text } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, LinkCard, Page, Section } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";

const VisualiserLesIndicateursPage = () => {
  return (
    <Page>
      <Section withShadow paddingY="3w">
        <BreadcrumbNav links={[NAVIGATION_PAGES.VisualiserLesIndicateurs]} />
        <Heading as="h1" marginTop="4w">
          {NAVIGATION_PAGES.VisualiserLesIndicateurs.title}
        </Heading>
        <Text marginTop="3v" fontSize="gamma" color="grey.800">
          Quelle vue souhaitez-vous afficher ?
        </Text>
        <HStack marginTop="3w" spacing="3w">
          <LinkCard variant="white" linkHref={NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire.path}>
            Vue territoriale
          </LinkCard>
          <LinkCard variant="white" linkHref={NAVIGATION_PAGES.VisualiserLesIndicateursParReseau.path}>
            Vue par réseau
          </LinkCard>
          <LinkCard variant="white" linkHref="">
            Vue par organismes de formation
          </LinkCard>
          <LinkCard variant="white" linkHref="">
            Vue par formation
          </LinkCard>
        </HStack>
      </Section>
    </Page>
  );
};

export default VisualiserLesIndicateursPage;
