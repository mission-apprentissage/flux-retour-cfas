import React from "react";
import Head from "next/head";
import { Flex } from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import InformationBlock from "@/modules/auth/inscription/components/InformationBlock";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import Inscription from "@/modules/auth/inscription/Inscription";
import { useRouter } from "next/router";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterPage = () => {
  const router = useRouter();
  const title = "Créer un compte";
  const { organismesAppartenance } = router.query;

  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Breadcrumb pages={[PAGES.homepage(), { title }]} />
      <Flex w="100%" mt={8} minH="40vh" direction={{ base: "column", md: "row" }}>
        <Inscription
          flexDirection="column"
          border="1px solid"
          organismesAppartenance={organismesAppartenance}
          h="100%"
          flexGrow={1}
          borderColor="openbluefrance"
        />
        <InformationBlock w={{ base: "100%", md: "50%" }} />
      </Flex>
    </Page>
  );
};

export default RegisterPage;
