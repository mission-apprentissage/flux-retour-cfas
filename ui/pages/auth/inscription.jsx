import React, { useState } from "react";
import Head from "next/head";
import { Text, Center, Heading, Box, ListItem, UnorderedList, HStack } from "@chakra-ui/react";

import { Page } from "../../components/Page/Page";
import { Inscription } from "../../modules/auth/inscription/Inscription";

import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterPage = () => {
  const styleProps = {
    flexBasis: "50%",
    p: 12,
    justifyContent: "center",
  };

  const [succeeded, setSucceeded] = useState(false);
  const title = "Créer un compte";
  return (
    <Page>
      <Head>
        <title>Inscription</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title }]} />
      <HStack spacing="4w" w="full" maxW="xl" mt={4}>
        {!succeeded && (
          <>
            <Inscription
              {...styleProps}
              flexDirection="column"
              border="1px solid"
              borderColor="openbluefrance"
              onSucceeded={() => {
                setSucceeded(true);
              }}
            />
          </>
        )}
        {succeeded && (
          <Center w="full" flexDirection="column" border="1px solid" borderColor="openbluefrance" p={12}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/advancedOutline.svg" alt="felicitation" />
            <Heading as="h2" fontSize="2xl" my={[3, 6]}>
              Félicitations, vous venez de créer votre compte !
            </Heading>
            <Text textAlign="center">
              Vous allez recevoir un courriel de confirmation à l&apos;adresse renseignée.
              <br />
              (n&apos;oubliez pas de vérifier vos indésirables).
            </Text>
          </Center>
        )}
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
};

export default RegisterPage;
