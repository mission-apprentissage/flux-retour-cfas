import { Box, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router";
import { NavLink } from "react-router-dom";

import { hasUserRoles, roles } from "../../common/auth/roles";
import { Page, Section } from "../../common/components";
import { PRODUCT_NAME } from "../../common/constants/product";
import useAuth from "../../common/hooks/useAuth";
import { CityHall, GraphsAndStatistics, School } from "../../theme/components/icons";
import AmeliorerLesPratiques from "./sections/ameliorer-les-pratiques/AmeliorerLesPratiques";
import CommentFonctionneLeTableauDeBord from "./sections/comment-fonctionne-le-tableau-de-bord/CommentFonctionneLeTableauDeBord";
import VosDonneesNourrissentLeTableauDeBord from "./sections/VosDonneesNourrissentLeTableauDeBord";
const HomePage = () => {
  const [auth] = useAuth();

  if (auth?.sub && hasUserRoles(auth, [roles.pilot, roles.administrator, roles.network])) {
    return <Redirect to="/visualiser-les-indicateurs" />;
  }

  return (
    <Page>
      <Section withShadow paddingY="4w" color="grey.800" background="#F6F6F6">
        <Box>
          <Flex>
            <Box flex="1" alignSelf="center">
              <Heading as="h1" fontSize="40px">
                Le {PRODUCT_NAME}
              </Heading>
              <Text fontSize="gamma" color="grey.800" marginTop="4w">
                Service public pour visualiser <strong>les effectifs d’apprentis en temps réel</strong> dans les centres
                et organismes de formation. Il permet ainsi aux pouvoirs publics de{" "}
                <strong>
                  piloter <br />
                  la politique de l’apprentissage
                </strong>{" "}
                nationalement et dans les territoires.
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
                Permettez le pilotage de la politique de l&apos;apprentissage en temps réel en donnant de la visibilité
                sur vos effectifs d&apos;apprentis.
              </Text>
              <Box marginTop="4w">
                <Link color="bluefrance" borderBottom="1px solid">
                  <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
                  Découvrir
                </Link>
              </Box>
            </Box>
            <Box width="50%" as={NavLink} to={"/login"} border="1px solid" borderColor="bluefrance" padding="4w">
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
                  Se connecter
                </Link>
              </Box>
            </Box>
          </HStack>
        </Box>
      </Section>
      <CommentFonctionneLeTableauDeBord />
      <VosDonneesNourrissentLeTableauDeBord />
      <AmeliorerLesPratiques />
    </Page>
  );
};

export default HomePage;
