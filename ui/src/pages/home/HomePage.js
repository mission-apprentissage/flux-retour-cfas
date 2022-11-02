import { Box, Flex, Heading, HStack, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router";
import { NavLink } from "react-router-dom";

import { hasUserRoles, roles } from "../../common/auth/roles";
import { Page, Section } from "../../common/components";
import ArrowLink from "../../common/components/ArrowLink/ArrowLink";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { PRODUCT_NAME } from "../../common/constants/product";
import useAuth from "../../common/hooks/useAuth";
import { CityHall, GraphsAndStatistics, QuestcequeLeTableauDeBordSVG, School } from "../../theme/components/icons";
import AmeliorerLesPratiques from "./sections/ameliorer-les-pratiques/AmeliorerLesPratiques";
import ApercuDonneesNationalHomePage from "./sections/apercu-donnees-national-homePage/ApercuDonneesNationalHomePage";
const HomePage = () => {
  const { auth, isAuthTokenValid } = useAuth();

  if (isAuthTokenValid() && hasUserRoles(auth, [roles.pilot, roles.administrator, roles.network])) {
    return <Redirect to="/visualiser-les-indicateurs" />;
  }

  return (
    <Page>
      <Section withShadow paddingY="6w" color="grey.800" background="#F6F6F6">
        <Flex>
          <Box flex="1" alignSelf="center">
            <Heading as="h1" fontSize="40px">
              Le {PRODUCT_NAME}
            </Heading>
            <Text fontSize="gamma" color="grey.800" marginTop="4w">
              Visualisez <strong>les effectifs d’apprentis en temps réel</strong>, au national et dans les territoires
            </Text>
          </Box>
          <GraphsAndStatistics />
        </Flex>
        <HStack marginTop="4w" spacing="3w" _hover={{ cursor: "pointer" }}>
          <Box
            as={NavLink}
            to={NAVIGATION_PAGES.OrganismeFormation.path}
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
            <Text marginTop="2w">Transmettez facilement les informations sur vos effectifs d’apprentis</Text>
            <Box marginTop="4w">
              <ArrowLink title="Se connecter" />
            </Box>
          </Box>
          <Box
            width="50%"
            as={NavLink}
            to={NAVIGATION_PAGES.Login.path}
            border="1px solid"
            borderColor="bluefrance"
            padding="4w"
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
            <Text marginY="3w">Consultez les données de l’apprentissage sur votre territoire</Text>
            <Box marginTop="4w">
              <ArrowLink title="Se connecter" />
            </Box>
          </Box>
        </HStack>
      </Section>
      <Section paddingY="4w" color="#000000">
        <Heading as="h1" fontSize="40px">
          A quoi sert le tableau de bord ?
        </Heading>
        <Flex>
          <Box paddingY="4w" fontSize="gamma">
            <Text>Le Tableau de bord de l’apprentissage, c’est : </Text>
            <UnorderedList paddingY="2w" marginLeft="4w">
              <ListItem>faciliter le pilotage des politiques publiques</ListItem>
              <ListItem>
                accompagner les jeunes en situation de décrochage (et donc d&apos;influencer leur.s parcours scolaires
                et professionnels)
              </ListItem>
              <ListItem>simplifier les déclarations des organismes de formation auprès des pouvoirs publics.</ListItem>
            </UnorderedList>
          </Box>
          <Box flex="1" textAlign="center">
            <QuestcequeLeTableauDeBordSVG />
          </Box>
        </Flex>
        <ApercuDonneesNationalHomePage />
      </Section>
      <AmeliorerLesPratiques />
    </Page>
  );
};

export default HomePage;
