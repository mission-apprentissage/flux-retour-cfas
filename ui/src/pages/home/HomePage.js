import { Box, Flex, Heading, HStack, Tag, Text } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router";
import { NavLink } from "react-router-dom";

import { Footer, LinkCard, Logo, Section } from "../../common/components";
import ContactSection from "../../common/components/ContactSection/ContactSection";
import { navigationPages } from "../../common/constants/navigationPages";
import useAuth from "../../common/hooks/useAuth";
import dashboardIllustration from "./dashboard-illustration.svg";
import ApercuDesDonneesSection from "./sections/ApercuDesDonneesSection";
import RgpdSection from "./sections/RgpdSection";

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
            <Tag marginBottom="1w" bgColor="bluefrance" color="white">
              beta
            </Tag>
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
        <HStack spacing="3w" marginTop="6w" alignItems="stretch">
          <LinkCard linkText="Accéder au tableau de bord" linkHref={navigationPages.Login.path}>
            Vous êtes une <strong>Institution ou une organisation professionnelle</strong> (OPCO, branche, etc.)
          </LinkCard>
          <LinkCard
            linkText="Transmettre et consulter vos données"
            linkHref={navigationPages.TransmettreEtConsulterVosDonnees.path}
          >
            Vous êtes un <strong>organisme de formation en apprentissage</strong>
          </LinkCard>
        </HStack>
      </Section>

      <ApercuDesDonneesSection />
      <RgpdSection marginTop="6w" />

      <Section paddingY="4w">
        <Flex alignItems="center">
          <Box as="i" paddingRight="1w" className="ri-arrow-right-line" />
          <NavLink to={navigationPages.DonneesPersonnelles.path}>en savoir plus</NavLink>
        </Flex>
      </Section>
      <ContactSection />
      <Footer />
    </>
  );
};

export default HomePage;
