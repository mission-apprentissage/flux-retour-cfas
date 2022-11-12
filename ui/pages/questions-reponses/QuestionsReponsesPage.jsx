import { Box, Heading, HStack, Text } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { BreadcrumbNav, Page, Section, Tuile } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { DataVisualisation, Notification, TechnicalError } from "../../theme/components/icons";
import QuestionsFrequemmementPosees from "./reponses-details/QuestionsFrequemmementPosees";

const QuestionsReponsesPage = () => {
  return (
    <Page>
      <Section paddingY="4w" withShadow>
        <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.QuestionsReponses]} />
      </Section>
      <Section>
        <Heading as="h1" fontSize="alpha">
          Une question ? Quelques éléments de réponse.
        </Heading>
      </Section>
      <Section paddingY="4w">
        <HStack spacing="2w">
          <Tuile>
            <Box as={NavLink} to={NAVIGATION_PAGES.QuestionsReponses.QuestCeQueLeTdb.path}>
              <DataVisualisation width="80px" height="80px" marginX="auto" display="block" />
              <Text marginTop="2w" color="#161616" fontWeight="700" textAlign="center">
                Qu’est-ce que le Tableau de bord de l’apprentissage ?
              </Text>
            </Box>
          </Tuile>
          <Tuile>
            <Box as={NavLink} to={NAVIGATION_PAGES.QuestionsReponses.CommentFonctionneLeTdb.path}>
              <TechnicalError width="80px" height="80px" marginX="auto" display="block" />
              <Text marginTop="2w" color="#161616" fontWeight="700" textAlign="center">
                Comment fonctionne le Tableau de bord ?
              </Text>
            </Box>
          </Tuile>
          <Tuile>
            <Box as={NavLink} to={NAVIGATION_PAGES.QuestionsReponses.ContacterLequipeDuTdb.path}>
              <Notification width="80px" height="80px" marginX="auto" display="block" />
              <Text marginTop="2w" color="#161616" fontWeight="700" textAlign="center">
                Contacter l’équipe du Tableau de bord
              </Text>
            </Box>
          </Tuile>
        </HStack>
        <Heading as="h2" fontSize="28px" marginTop="4w">
          Questions fréquemment posées
        </Heading>
        <Box width="70%">
          <QuestionsFrequemmementPosees />
        </Box>
      </Section>
    </Page>
  );
};

export default QuestionsReponsesPage;
