import { Box, Flex, Heading, HStack, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import React from "react";
import { Page } from "../components";
import Section from "../components/Section/Section";
import ArrowLink from "../components/ArrowLink/ArrowLink";
import { NAVIGATION_PAGES } from "../common/constants/navigationPages";
import { PRODUCT_NAME } from "../common/constants/product";
// import useAuth from "../hooks/useAuth";
import { CityHall, GraphsAndStatistics, QuestcequeLeTableauDeBordSVG, School } from "../theme/components/icons";
import AmeliorerLesPratiques from "./sections/ameliorer-les-pratiques/AmeliorerLesPratiques";
import ApercuDonneesNationalHomePage from "./sections/apercu-donnees-national-homePage/ApercuDonneesNationalHomePage";
import Head from "next/head";
import { getAuthServerSideProps } from "../common/SSR/getAuthServerSideProps";
export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function Home() {
  const title = PRODUCT_NAME;

  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Section bg="galt">
        <Flex>
          <Box flex="1" alignSelf="center">
            <Heading as="h1" fontSize="40px">
              Le {title}
            </Heading>
            <Text fontSize="gamma" color="grey.800" marginTop="4w">
              Visualisez <strong>les effectifs d’apprentis en temps réel</strong>, au national et dans les territoires
            </Text>
          </Box>
          <GraphsAndStatistics display={["none", "none", "none", "inline-block"]} />
        </Flex>
        <HStack
          marginTop="4w"
          spacing={["0", "0", "0", "3w"]}
          _hover={{ cursor: "pointer" }}
          flexDirection={["column", "column", "column", "row"]}
        >
          <Box
            to={NAVIGATION_PAGES.OrganismeFormation.path}
            border="1px solid"
            borderColor="bluefrance"
            padding="4w"
            marginBottom={["2w", "2w", "2w", "0"]}
            width={["100%", "100%", "100%", "50%"]}
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
            width={["100%", "100%", "100%", "50%"]}
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
            <QuestcequeLeTableauDeBordSVG display={["none", "none", "none", "inline-block"]} />
          </Box>
        </Flex>
        <ApercuDonneesNationalHomePage />
      </Section>
      <AmeliorerLesPratiques />
    </Page>
  );
}
