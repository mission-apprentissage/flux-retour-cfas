import { Flex } from "@chakra-ui/react";
import React from "react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import Login from "@/modules/auth/connexion/Connexion";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import InformationBlock from "@/modules/auth/inscription/components/InformationBlock";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function ConnexionPage() {
  const title = "Connexion";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Breadcrumb pages={[PAGES.homepage(), { title }]} />
      <Flex w="100%" mt={8} minH="40vh" direction={{ base: "column", md: "row" }}>
        <Login w={{ base: "100%", md: "50%" }} h="100%" border="1px solid" borderColor="openbluefrance" />
        <InformationBlock w={{ base: "100%", md: "50%" }} />
      </Flex>
    </Page>
  );
}
