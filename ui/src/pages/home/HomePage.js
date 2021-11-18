import { Flex, Heading, HStack, Text } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router";

import { Footer, LinkCard, Logo, Section } from "../../common/components";
import ContactSection from "../../common/components/ContactSection/ContactSection";
import { navigationPages } from "../../common/constants/navigationPages";
import useAuth from "../../common/hooks/useAuth";
import ApercuDesDonneesSection from "./ApercuDesDonneesSection";
import dashboardIllustration from "./dashboard-illustration.svg";
import RgpdSection from "./RgpdSection";

const HomePage = () => {
  const [auth] = useAuth();

  if (auth?.sub) {
    return <Redirect to="/tableau-de-bord" />;
  }

  return (
    <>
      <Section>
        <Logo />
      </Section>
      <Section paddingY="4w">
        <Flex>
          <div>
            <Heading as="h1" fontSize="40px">
              Le tableau de bord de l&apos;apprentissage
            </Heading>
            <Text fontSize="alpha" color="grey.800" marginTop="1w">
              Mettre à disposition des <strong>différents acteurs</strong> les <strong>données clés</strong> de
              l&apos;apprentissage en <strong>temps réel</strong>
            </Text>
          </div>
          <img src={dashboardIllustration} alt="illustration tableau de bord" />
        </Flex>
        <HStack spacing="3w" marginTop="6w">
          <LinkCard linkText="Accéder au tableau de bord" linkHref={navigationPages.Login.path}>
            Vous êtes une <strong>Institution ou une organisation</strong>
          </LinkCard>
          <LinkCard
            linkText="Transmettre et consulter vos données"
            linkHref={navigationPages.TransmettreEtConsulterVosDonnees.path}
          >
            Vous êtes un <strong>organisme de formation</strong>
          </LinkCard>
        </HStack>
      </Section>

      <ApercuDesDonneesSection />

      <RgpdSection />

      <ContactSection />
      <Footer />
    </>
  );
};

export default HomePage;
