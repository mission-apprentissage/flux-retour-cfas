import React from "react";
import Head from "next/head";
import { Text, Center, Heading, Flex } from "@chakra-ui/react";

import Page from "@/components/Page/Page";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterPage = () => {
  const title = "Créer un compte";
  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title }]} />
      <Flex w="100%" mt={8} minH="40vh" direction={{ base: "column", md: "row" }}>
        <Center w="full" flexDirection="column" border="1px solid" borderColor="openbluefrance" p={12}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/advancedOutline.svg" alt="felicitation" />
          <Heading as="h2" fontSize="2xl" my={[3, 6]}>
            Félicitations, vous venez de créer votre compte !
          </Heading>
          <Text textAlign="center">
            Vous allez recevoir un courriel de confirmation à l&apos;adresse renseignée
            <br />
            (n&apos;oubliez pas de vérifier vos indésirables).
          </Text>
        </Center>
      </Flex>
    </Page>
  );
};

export default RegisterPage;
