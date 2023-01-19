import { Flex } from "@chakra-ui/react";
import React from "react";
import Head from "next/head";
import { Page } from "../../components";
import Login from "../../modules/auth/connexion/Connexion";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";

import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import InformationBlock from "../../modules/auth/inscription/components/InformationBlock";

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
      </Head>
      <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title }]} />
      <Flex w="100%" mt={8} minH="40vh">
        <Login
          {...styleProps}
          flexDirection="column"
          flexGrow={1}
          h="100%"
          border="1px solid"
          borderColor="openbluefrance"
        />

        <InformationBlock w="50%" p={10} />
      </Flex>
    </Page>
  );
}
