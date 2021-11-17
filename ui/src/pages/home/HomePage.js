import { Box, Button, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { Redirect } from "react-router";
import { NavLink } from "react-router-dom";

import { Logo, Section } from "../../common/components";
import ContactSection from "../../common/components/ContactSection/ContactSection";
import useAuth from "../../common/hooks/useAuth";
import ApercuDesDonneesSection from "./ApercuDesDonneesSection";
import dashboardIllustration from "./dashboard-illustration.svg";
import RgpdSection from "./RgpdSection";

const VousEtesCard = ({ children, linkText, linkHref }) => {
  return (
    <Box background="bluefrance" fontSize="gamma" paddingY="3w" paddingX="4w" flex="1">
      <Text color="white" marginBottom="2w">
        Vous êtes {children}
      </Text>
      <NavLink to={linkHref}>
        <Button background="#9A9AFF" size="lg" color="bluefrance" padding="3w" paddingY="0">
          {linkText}
          <Box as="i" className="ri-arrow-right-line" marginLeft="1w" verticalAlign="middle" />
        </Button>
      </NavLink>
    </Box>
  );
};

VousEtesCard.propTypes = {
  linkHref: PropTypes.string.isRequired,
  linkText: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

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
          <VousEtesCard linkText="Accéder au tableau de bord" linkHref="/login">
            une <strong>Institution ou une organisation</strong>
          </VousEtesCard>
          <VousEtesCard linkText="Transmettre et consulter vos données" linkHref="/">
            un <strong>organisme de formation</strong>
          </VousEtesCard>
        </HStack>
      </Section>

      <ApercuDesDonneesSection />

      <RgpdSection />

      <ContactSection />
    </>
  );
};

export default HomePage;
