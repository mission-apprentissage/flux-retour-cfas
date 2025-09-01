import { Text, Center, Heading } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const BravoPage = () => {
  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Center w="full" flexDirection="column" border="1px solid" borderColor="openbluefrance" p={12}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/advancedOutline.svg" alt="felicitation" />
        <Heading as="h2" fontSize="2xl" my={[3, 6]}>
          Vérifiez votre boite mail !
        </Heading>
        <Text textAlign="center">
          Vous allez recevoir un email de confirmation vous permettant de valider votre compte
          <br />
          (n&apos;oubliez pas de vérifier vos courriers indésirables).
        </Text>
      </Center>
    </Page>
  );
};

export default BravoPage;
