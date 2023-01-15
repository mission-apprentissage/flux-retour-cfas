import { Box, HStack, Text, UnorderedList, ListItem } from "@chakra-ui/react";
import React from "react";
import Head from "next/head";
import { Page } from "../../components";
import Login from "../../modules/auth/connexion/Connexion";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";

import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function ConnexionPage() {
  const styleProps = {
    flexBasis: "50%",
    p: 12,
    justifyContent: "center",
  };
  const title = "Connexion";

  return (
    <Page>
      <Head>
        <title>Connexion</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title }]} />
      <HStack spacing="4w" mt={4} mb="8w">
        <Login {...styleProps} flexDirection="column" border="1px solid" borderColor="openbluefrance" />
        <Box alignSelf="start">
          <Text fontWeight={700} fontSize={22}>
            Votre compte dédié
          </Text>
          <Text mt="2w" fontWeight={700}>
            Le service tableau de bord de l&apos;apprentissage est porté par la Mission interministérielle pour
            l’apprentissage.
          </Text>
          <Text mt="2w">Il permet de :</Text>
          <UnorderedList ml="4w" mt="2w">
            <ListItem>Faciliter le pilotage des politiques publiques</ListItem>
            <ListItem>
              Accompagner les jeunes en situation de décrochage (et donc d&apos;influencer leur.s parcours scolaires et
              professionnels)
            </ListItem>
            <ListItem>Simplifier les déclarations des organismes de formation auprès des pouvoirs publics</ListItem>
          </UnorderedList>
        </Box>
      </HStack>
    </Page>
  );
}
