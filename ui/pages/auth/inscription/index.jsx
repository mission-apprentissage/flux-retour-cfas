import React from "react";
import Head from "next/head";
import { Flex } from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import InformationBlock from "@/modules/auth/inscription/components/InformationBlock";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import InscriptionStep0 from "@/modules/auth/inscription/InscriptionStep0";
import { useRouter } from "next/router";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterPage = () => {
  const router = useRouter();
  const title = "Créer un compte";
  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Breadcrumb pages={[PAGES.homepage(), { title }]} />
      <Flex w="100%" mt={8} minH="40vh" direction={{ base: "column", md: "row" }}>
        <InscriptionStep0
          flexDirection="column"
          border="1px solid"
          h="100%"
          flexGrow={1}
          borderColor="openbluefrance"
          onSelect={(oganismeAppartenance) => {
            router.push(`/auth/inscription/${oganismeAppartenance}`);
          }}
        />
        <InformationBlock w={{ base: "100%", md: "50%" }} />
      </Flex>
    </Page>
  );
};

export default RegisterPage;
