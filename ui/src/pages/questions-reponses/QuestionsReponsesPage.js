import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Heading,
  HStack,
  Link,
  ListItem,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { BreadcrumbNav, Page, Section, Tuile } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { DataVisualisation, Notification, TechnicalError } from "../../theme/components/icons";

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
          <Accordion allowMultiple fontSize="zeta" color="#3A3A3A" marginTop="2w">
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontSize="delta">
                    Qu’est-ce que l’outil Tableau de bord de l’apprentissage ?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel paddingBottom={4}>
                <Text>
                  Le Tableau de bord de l’Apprentissage est un produit créé par la Mission Interministérielle pour
                  l’Apprentissage. <br />
                  Il permet de visualiser en temps réel les effectifs d’apprentis dans les centres de formation et les
                  organismes de formation, permettant aux pouvoirs publics de piloter au mieux la politique de
                  l’apprentissage nationalement et localement. <br />
                  Il est hébergé sur{" "}
                  <Link href="https://cfas.apprentissage.beta.gouv.fr" color="bluefrance" textDecoration="underLine">
                    https://cfas.apprentissage.beta.gouv.fr <Box as="i" className="ri--link-line" />
                  </Link>
                </Text>
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontSize="delta">
                    Qu’est-ce que la mission interministérielle pour l’apprentissage ?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel paddingBottom={4}>
                <Box>
                  La mission pour l’apprentissage a pour but de :
                  <UnorderedList marginLeft="3w">
                    <ListItem>Rendre visibles les offres de formation et de contrats d’apprentissage ;</ListItem>
                    <ListItem>Sécuriser et fluidifier les inscriptions en apprentissage ;</ListItem>
                    <ListItem>Aider les jeunes à s’orienter ;</ListItem>
                    <ListItem>Aider les jeunes et les entreprises à se comprendre ;</ListItem>
                    <ListItem>Diminuer les ruptures des contrats d’apprentissage.</ListItem>
                  </UnorderedList>
                  <br />
                  Pour en savoir plus et connaître les autres produits et services de la mission,{" "}
                  <Link
                    href="https://mission-apprentissage.gitbook.io/general/la-mission-apprentissage/les-services-attendus-de-la-mission-apprentissage"
                    color="bluefrance"
                    textDecoration="underLine"
                  >
                    consulter le Gitbook de la mission. <Box as="i" className="ri--link-line" />
                  </Link>
                </Box>
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontSize="delta">
                    Pour quels usages et quels utilisateurs a été conçu le Tableau de bord ?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel paddingBottom={4}>
                <Text>
                  Le Tableau de bord de l’apprentissage a été conçu pour répondre aux besoins du ministère du Travail et
                  du ministère de l’Éducation Nationale, de l’Enseignement supérieur et de la Transformation publique,
                  en terme de visibilité sur les chiffres clés de l’apprentissage. <br />
                  Pour en savoir plus sur les utilisateurs du Tableau de bord de l’apprentissage, <br />
                  consultez{" "}
                  <Link to="/organisme-formation/aide" as={NavLink} color="bluefrance" textDecoration="underLine">
                    Qui peut consulter les données de votre organisme ? <Box as="i" className="ri--link-line" />
                  </Link>
                </Text>
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontSize="delta">
                    Quel est l’objectif du Tableau de bord ?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel paddingBottom={4}>
                <Text>
                  Le Tableau de bord doit permettre aux pouvoir publics locaux et nationaux de piloter la politique de
                  l’apprentissage au plus juste de la réalité du terrain. Pour cela il doit fournir des chiffres-clés de
                  l’apprentissage exhaustifs, fiables et en temps réel pour représenter au mieux la situation des
                  organismes de formation, ainsi que celle des apprenantes et apprenants.
                </Text>
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontSize="delta">
                    Que recouvrent les chiffres clefs de l’apprentissage ?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel paddingBottom={4}>
                <Text>
                  L’équipe du Tableau de bord récolte des données permettant d’identifier, de fiabiliser et de contrôler
                  les données concernant les apprenantes et apprenants, les formations, les contrats et les organismes
                  de formation.
                  <br />
                  <br />
                  Aucune donnée n’est modifiée ou retraitée. Elles permettent d’identifier le nombre d’ “apprentis”
                  (avec formation et contrat), de stagiaires de la formation professionnelle ou “inscrits sans contrat”
                  (inscrits en formation mais sans aucun contrat pour cette formation), de “rupturants” (inscrits en
                  formation avec un contrat rompu en attente d’un nouveau contrat), “abandons” (ayant quitté la
                  formation et l’employeur).
                  <br />
                  <br />
                  Pour en savoir plus, consulter la rubrique{" "}
                  <Link to="/comprendre-les-donnees" as={NavLink} color="bluefrance" textDecoration="underLine">
                    Comprendre les données <Box as="i" className="ri--link-line" />
                  </Link>
                </Text>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>
      </Section>
    </Page>
  );
};

export default QuestionsReponsesPage;
