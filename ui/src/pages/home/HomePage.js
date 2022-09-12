import { Box, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router";
import { NavLink } from "react-router-dom";

import { hasUserRoles, roles } from "../../common/auth/roles";
import { Page, Section } from "../../common/components";
import { PRODUCT_NAME } from "../../common/constants/product";
import useAuth from "../../common/hooks/useAuth";
import { CityHall, GraphsAndStatistics, School } from "../../theme/components/icons";
import ApercuDesDonneesSection from "./sections/ApercuDesDonneesSection";
import RgpdSection from "./sections/RgpdSection";

const HomePage = () => {
  const [auth] = useAuth();

  if (auth?.sub && hasUserRoles(auth, [roles.pilot, roles.administrator, roles.network])) {
    return <Redirect to="/visualiser-les-indicateurs" />;
  }

  return (
    <Page>
      <Section withShadow paddingY="4w" color="#000000" background="#F6F6F6">
        <Box>
          <Flex>
            <Box flex="1" alignSelf="center">
              <Heading as="h1" fontSize="40px">
                Le {PRODUCT_NAME}
              </Heading>
              <Text fontSize="gamma" color="grey.800" marginTop="4w">
                Le service public pour visualiser en <strong>temps réel</strong> les effectifs d’apprentis dans les
                centres et organismes de formation. Il permet aux pouvoirs publics de <strong>piloter</strong> la
                politique de l’apprentissage nationalement et dans les territoires.
              </Text>
            </Box>
            <GraphsAndStatistics />
          </Flex>
          <HStack marginTop="4w" spacing="3w" _hover={{ cursor: "pointer" }}>
            <Box
              as={NavLink}
              to={"/organisme-formation"}
              border="1px solid"
              borderColor="bluefrance"
              padding="4w"
              width="50%"
            >
              <Flex>
                <School />
                <Box alignSelf="center" marginLeft="2w">
                  <Text fontSize="gamma">
                    Vous êtes un{" "}
                    <strong>
                      organisme de formation <br />
                      en apprentissage
                    </strong>
                  </Text>
                </Box>
              </Flex>
              <Text marginTop="2w">
                Permettez le <strong>pilotage</strong> de la politique de l&apos;apprentissage en temps réel en donnant
                de la <strong>visibilité</strong> sur vos effectifs d&apos;apprentis.
              </Text>
              <Box marginTop="4w">
                <Link color="bluefrance" borderBottom="1px solid">
                  <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
                  Découvrir
                </Link>
              </Box>
            </Box>
            <Box
              as={NavLink}
              to={"/consulter-vos-donnees"}
              border="1px solid"
              borderColor="bluefrance"
              padding="4w"
              width="50%"
            >
              <Flex>
                <CityHall />
                <Box alignSelf="center" marginLeft="2w">
                  <Text fontSize="gamma">
                    Vous êtes une{" "}
                    <strong>
                      institution ou une <br />
                      organisation professionnelle
                    </strong>
                  </Text>
                </Box>
              </Flex>
              <Text marginTop="2w">
                Connectez-vous pour consulter les données de l’apprentissage sur votre territoire.
              </Text>
              <Box marginTop="4w">
                <Link color="bluefrance" borderBottom="1px solid">
                  <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
                  Consulter les données
                </Link>
              </Box>
            </Box>
          </HStack>
        </Box>
      </Section>
      <ApercuDesDonneesSection />
      <RgpdSection marginTop="6w" />
    </Page>
  );
};

export default HomePage;
