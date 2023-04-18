import React from "react";
import Head from "next/head";
import {
  Box,
  Container,
  Heading,
  ListItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  UnorderedList,
} from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import FAQ from "@/modules/questions/faq";
import Definitions from "@/modules/questions/definitions";
import DonneesRecoltees from "@/modules/questions/donnees-recoltees";
import CalculIndicateurs from "@/modules/questions/calcul-indicateurs";
import PilotageParLaDonnee from "@/modules/questions/pilotage-par-la-donnee";
import CycleVieApprenti from "@/modules/questions/cycle-vie-apprenti";

const QuestionsPage = () => {
  const title = "Comprendre le fonctionnement du tableau de bord";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Container maxW="xl" px={0}>
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={6} mt={8}>
          {title}
        </Heading>
        <Text mb={4}>
          Le tableau de bord de l’apprentissage collecte les effectifs auprès des organismes de formation à destination
          des pilotes de l’apprentissage en France et les territoires (DREETS, Conseils régionaux, Académies, réseau
          Carif-Oref...). Ces données permettent un <strong>pilotage national et territorial</strong>. À ce titre,
          comprendre les données récoltées est essentiel pour chaque acteur du monde de l’apprentissage.
        </Text>
        <Text mb={4}>
          Aujourd’hui, les données affichées sur le tableau de bord sont collectées auprès des organismes de formation
          de deux manières :
        </Text>
        <UnorderedList mb={4} pl={1}>
          <ListItem>
            en se connectant via leur ERP ou logiciel de gestion (voir la liste). Grâce à une API, l’envoi des données
            au tableau de bord est automatique.
          </ListItem>
          <ListItem>
            soit en se connectant à leur compte Tableau de bord qui permet depuis Janvier 2023 le téléversement des
            données.
          </ListItem>
        </UnorderedList>

        <Box my={8} px={8} py={6} borderLeft="solid 4px #6A6AF4" bg="#EEEEEE" maxW="792px">
          <Text as="h4" fontSize="2xl" fontWeight="700" mb={2}>
            Un schéma de données réactualisé au 12 décembre 2022
          </Text>
          <Text>
            Pour permettre le pilotage de l’apprentissage, le tableau de bord collecte les statuts d’un apprenti qui
            permettent de retracer son parcours au sein d’un organisme de formation et d’une entreprise. Les dates du
            parcours sont :
          </Text>
          <Text>- inscription en formation sans contrat et en recherche d’une entreprise</Text>
          <Text>- inscription en formation et contrat signé en entreprise (apprenti)</Text>
          <Text>- inscription en formation, rupture avec l’entreprise et en recherche d’une autre</Text>
          <Text>- désinscription de la formation et de l’entreprise</Text>
        </Box>

        <Tabs isLazy lazyBehavior="keepMounted">
          <TabList>
            <Tab fontWeight="bold" fontSize="epsilon">
              FAQ
            </Tab>
            <Tab fontWeight="bold" fontSize="epsilon">
              Définitions
            </Tab>
            <Tab fontWeight="bold" fontSize="epsilon">
              Les données récoltées
            </Tab>
            <Tab fontWeight="bold" fontSize="epsilon">
              Calcul des indicateurs
            </Tab>
            <Tab fontWeight="bold" fontSize="epsilon">
              Pilotage par la donnée
            </Tab>
            <Tab fontWeight="bold" fontSize="epsilon">
              Cycle de vie de l’apprenti
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <FAQ />
            </TabPanel>
            <TabPanel>
              <Definitions />
            </TabPanel>
            <TabPanel>
              <DonneesRecoltees />
            </TabPanel>
            <TabPanel>
              <CalculIndicateurs />
            </TabPanel>
            <TabPanel>
              <PilotageParLaDonnee />
            </TabPanel>
            <TabPanel>
              <CycleVieApprenti />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Page>
  );
};

export default QuestionsPage;
