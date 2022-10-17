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
import QuestionsFrequemmementPosees from "../questions-reponses/reponses-details/QuestionsFrequemmementPosees.js";
import AmeliorerLesPratiques from "./sections/ameliorer-les-pratiques/AmeliorerLesPratiques";
import ApercuDonneesNationalHomePage from "./sections/apercu-donnees-national-homePage/ApercuDonneesNationalHomePage";
import CommentFonctionneLeTableauDeBord from "./sections/comment-fonctionne-le-tableau-de-bord/CommentFonctionneLeTableauDeBord";
import VosDonneesNourrissentLeTableauDeBord from "./sections/VosDonneesNourrissentLeTableauDeBord";
const HomePage = () => {
  const [auth] = useAuth();

  if (auth?.sub && hasUserRoles(auth, [roles.pilot, roles.administrator, roles.network])) {
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
            <Text marginTop="2w">
              Permettez le pilotage de la politique de l&apos;apprentissage en temps réel en donnant de la visibilité
              sur vos effectifs d&apos;apprentis.
            </Text>
            <Box marginTop="4w">
              <ArrowLink title="Découvrir" />
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
            <Text marginTop="2w">
              Connectez-vous pour consulter les données de l’apprentissage sur votre territoire.
            </Text>
            <Box marginTop="4w">
              <ArrowLink title="Se connecter" />
            </Box>
          </Box>
        </HStack>
      </Section>
      <Section paddingY="4w" color="#000000">
        <Heading as="h1" fontSize="40px">
          Qu’est-ce que le Tableau de bord ?
        </Heading>
        <Flex>
          <Box paddingY="4w" fontSize="gamma">
            <Text>Le Tableau de bord de l’apprentissage, c’est : </Text>
            <UnorderedList paddingY="2w" marginLeft="4w">
              <ListItem>
                une <strong>visibilité</strong> sur le déroulement de l’apprentissage en France en temps réel
              </ListItem>
              <ListItem>
                un <strong>pilotage</strong> de l’activité au niveau national et dans les territoires
              </ListItem>
              <ListItem>
                une <strong>fine connaissance</strong> des répartitions par filière, type de formation, etc...
              </ListItem>
              <ListItem>
                un <strong>outil</strong> en constante amélioration pour coller au plus près de la réalité
              </ListItem>
              <ListItem>
                une <strong>collaboration</strong> avec des éditeurs d’ERP
              </ListItem>
              <ListItem>
                un <strong>service</strong> dédié aux organismes de formation
              </ListItem>
            </UnorderedList>
            <Text>
              Le Tableau de Bord de l’Apprentissage est construit dans le{" "}
              <strong>
                respect de la vie <br />
                privée des personnes et applique les standards de sécurité de l&apos;Etat.
              </strong>
            </Text>
          </Box>
          <Box flex="1" textAlign="center">
            <QuestcequeLeTableauDeBordSVG />
          </Box>
        </Flex>
        <ApercuDonneesNationalHomePage />
      </Section>
      <CommentFonctionneLeTableauDeBord />
      <VosDonneesNourrissentLeTableauDeBord />
      <AmeliorerLesPratiques />
      <Section paddingY="4w" color="grey.800">
        <Heading as="h1">Des questions ?</Heading>
        <QuestionsFrequemmementPosees isHomePage={true} />
      </Section>
    </Page>
  );
};

export default HomePage;
