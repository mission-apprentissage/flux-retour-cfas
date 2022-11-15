import React from "react";
import Head from "next/head";
import { Box, Container, Flex, Heading, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react";

import { Page } from "../components/Page/Page";
import { Breadcrumb } from "../components/Breadcrumb/Breadcrumb";
import Sommaire from "../components/Sommaire/Sommaire";
import { PRODUCT_NAME } from "../common/constants/product";

const ComprendreLesDonneesPage = () => {
  const title = "Comprendre les données";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Box paddingTop="3w">
            <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
          </Box>
        </Container>
      </Box>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]} color="grey.800" marginTop="5w" marginBottom="10w">
        <Container maxW="xl">
          <Flex>
            <Sommaire>
              <Flex flexDirection="column" paddingRight="10w" fontSize="zeta">
                <Link padding="1w" href="#collecte" _hover={{ textDecoration: "none", bg: "grey.200" }}>
                  <Text>
                    <Text as="span" fontWeight="700">
                      1.
                    </Text>{" "}
                    Collecte des données
                  </Text>
                </Link>
                <Link padding="1w" href="#calcul" _hover={{ textDecoration: "none", bg: "grey.200" }}>
                  <Text marginTop="1w">
                    <Text as="span" fontWeight="700">
                      2.
                    </Text>{" "}
                    Calcul des indicateurs
                  </Text>
                </Link>
              </Flex>
            </Sommaire>
            <Box marginLeft="10w" width="65%">
              <Heading as="h1" variant="h1" marginBottom="1w" color="black">
                Comprendre les données
              </Heading>
              <Box marginTop="5w">
                <Heading as="h3" variant="h3" fontSize="28px" id="collecte">
                  Collecte des données
                </Heading>
                <Text fontSize="gamma" fontWeight="700" marginTop="2w">
                  D&apos;où viennent les chiffres ?
                </Text>
                <Text>
                  Nous collectons des données auprès des organismes de formation en nous connectant à leur ERP.{" "}
                </Text>
              </Box>
              <Box marginTop="5w">
                <Text fontSize="gamma" fontWeight="700">
                  Quelles sont les données collectées et leur format ?
                </Text>
                <Text>
                  Les données sont collectées par la clé d’entrée de l’apprenant, les champs récupérés sont les suivants
                  :
                </Text>
                <UnorderedList marginLeft="5w">
                  <ListItem>INE ;</ListItem>
                  <ListItem>Nom de l’apprenant ;</ListItem>
                  <ListItem>Prénom de l’apprenant ;</ListItem>
                  <ListItem>Date de naissance de l’apprenant ;</ListItem>
                  <ListItem>Code Postal du lieu de résidence de l’apprenant ;</ListItem>
                  <ListItem>Adresse mail de l’apprenant ;</ListItem>
                  <ListItem>Statut de l’apprenant : inscrit, apprenti et abandon ;</ListItem>
                  <ListItem>Intitulé de la formation ;</ListItem>
                  <ListItem>Code formation diplôme ;</ListItem>
                  <ListItem>RNCP;</ListItem>
                  <ListItem>Année de la formation ;</ListItem>
                  <ListItem>Date de début et date de fin de la formation ;</ListItem>
                  <ListItem>Localisation ;</ListItem>
                  <ListItem>UAI de l’organisme de formation ;</ListItem>
                  <ListItem>SIRET de l’organisme de formation ;</ListItem>
                  <ListItem>Raison sociale ;</ListItem>
                  <ListItem>Code Postal du lieu de formation ;</ListItem>
                  <ListItem>Date de début et date de fin du contrat en apprentissage ;</ListItem>
                  <ListItem>Date de rupture de contrat ;</ListItem>
                </UnorderedList>
                <Box fontWeight="700" marginTop="2w">
                  <Text>Définitions :</Text>
                  <UnorderedList marginLeft="5w">
                    <ListItem>
                      Un apprenant unique est identifié quand il y a unicité sur la combinaison suivante : Nom, Prénom,
                      CFD de la formation, UAI de l’organisme de formation.On décompte donc 1 apprenant pour 1
                      combinaison.
                    </ListItem>
                    <ListItem>
                      Les données sont collectées par la clé d’entrée de l’apprenant, les champs récupérés sont les
                      suivants : Un organisme est une entité définie par l’UAI. On décompte donc 1 organisme pour 1 UAI.
                    </ListItem>
                  </UnorderedList>
                </Box>
                <Text fontSize="gamma" fontWeight="700" marginTop="5w">
                  Pourquoi ne peut-on pas avoir accès aux données sur toutes les régions ?
                </Text>
                <Text>
                  ‌Le Tableau de bord est déployé en version Bêta, c&apos;est-à-dire que nous continuons à travailler
                  sur les données exposées avec les utilisateurs. Nous conduisons pour cela un déploiement incrémental
                  qui démarre par les Régions : Normandie, Centre-Val de Loire, Pays de la Loire, Bretagne et
                  Auvergne-Rhône Alpes. Lorsque nous aurons achevé la première phase de validation des données, nous
                  étendrons le périmètre géographique. La fin du déploiement est prévue d&apos;ici la fin de
                  l&apos;année.
                </Text>
              </Box>
              <Box marginTop="10w">
                <Heading as="h3" variant="h3" fontSize="28px" marginBottom="1w" color="black" id="calcul">
                  Calcul des indicateurs
                </Heading>
                <Text fontSize="gamma" fontWeight="700" marginTop="2w">
                  A quelle date l&apos;indice &quot;Effectif&quot; est-il arrêté ?
                </Text>
                <Text>
                  ‌A ce jour, Yparéo nous transmet les données de manière quotidienne et Gesti chaque lundi. De fait,
                  les données sont constamment rafraîchies. ‌Lorsque vous consultez le mois en cours, les effectifs
                  affichés sont ceux du dernier jour disponible, par exemple si le 12 janvier 2021, vous sélectionnez la
                  période &quot;janvier 2021&quot; , vous pourrez connaître les effectifs comptabilisés au 12 janvier.
                  ‌Lorsque vous sélectionnez un mois antérieur, les effectifs affichés sont une photographie &quot;fin
                  de mois&quot;, c&apos;est-à-dire au dernier jour du mois consulté. Par exemple, si toujours le 12
                  janvier 2021, vous sélectionnez la période &quot;décembre 2019, vous pourrez connaître les effectifs
                  comptabilisés au 31 décembre.
                </Text>
              </Box>
              <Box marginTop="5w">
                <Text fontSize="gamma" fontWeight="700">
                  Y a-t-il un traitement statistique des données ?
                </Text>
                <Text>
                  ‌Non. Nous effectuons un dédoublonnement à partir des données personnelles des apprentis et nous
                  constituons un historique afin de pouvoir tracer les changements de statut d&aposun apprenant
                  (d&apos;Apprenti à Abandon, par exemple) mais nous ne faisons aucun traitement statistique. ‌Les
                  données exposées correspondent aux effectifs des CFA en temps réel. De ce fait, lorsqu&apos;un
                  établissement enregistre une information dans son Système d&apos;Information (Inscription, Nouveau
                  Contrat...) l&apos;information est restituée le lendemain ou la semaine suivante au plus tard (Gesti)
                  dans le {PRODUCT_NAME}.
                </Text>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Page>
  );
};

export default ComprendreLesDonneesPage;
