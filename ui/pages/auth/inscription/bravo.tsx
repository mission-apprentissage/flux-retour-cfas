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
          Félicitations, vous venez de créer votre compte !
        </Heading>
        <Text textAlign="center">
          Vous allez recevoir un courriel de confirmation à l&apos;adresse renseignée
          <br />
          (n&apos;oubliez pas de vérifier vos indésirables).
        </Text>
      </Center>
    </Page>
  );
};

export default BravoPage;
