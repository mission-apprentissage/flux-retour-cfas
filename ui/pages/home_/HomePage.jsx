import { Box, Flex, Heading, HStack, Image, Text } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router";

import { hasUserRoles, roles } from "../../common/auth/roles";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { PRODUCT_NAME } from "../../common/constants/product";
import { LinkCard, Page, Section } from "../../components";
import useAuth from "../../hooks/useAuth";
import dashboardIllustration from "./dashboard-illustration.svg";
import ApercuDesDonneesSection from "./sections/ApercuDesDonneesSection";
import RgpdSection from "./sections/RgpdSection";

const HomePage = () => {
  const { auth, isAuthTokenValid } = useAuth();

  if (isAuthTokenValid() && hasUserRoles(auth, [roles.pilot, roles.administrator, roles.network])) {
    return <Redirect to="/visualiser-les-indicateurs" />;
  }

  return (
    <Page>
      <Section withShadow paddingY="4w">
        <Box>
          <Flex>
            <Box flex="1">
              <Heading as="h1" fontSize="40px">
                Le {PRODUCT_NAME}
              </Heading>
              <Text fontSize="beta" color="grey.800" marginTop="4w">
                Mettre à disposition des <strong>différents acteurs</strong> <br />
                les <strong>données clés</strong> de l&apos;apprentissage en <strong>temps réel</strong>
              </Text>
            </Box>
            <Image src={dashboardIllustration} alt="illustration tableau de bord" paddingBottom="3w" />
          </Flex>
          <HStack spacing="3w" _hover={{ cursor: "pointer" }}>
            <LinkCard linkHref={NAVIGATION_PAGES.Login.path}>
              Vous êtes une{" "}
              <strong>
                institution ou une organisation <br />
                professionnelle{" "}
              </strong>
              (OPCO, branche, etc...)
            </LinkCard>
            <LinkCard linkHref={NAVIGATION_PAGES.OrganismeFormation.path}>
              Vous êtes un{" "}
              <strong>
                organisme de formation <br />
                en apprentissage
              </strong>
            </LinkCard>
          </HStack>
        </Box>
      </Section>
      <ApercuDesDonneesSection />
      <RgpdSection marginTop="6w" />
    </Page>
  );
};

export default HomePage;
