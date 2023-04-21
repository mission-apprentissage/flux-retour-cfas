import { Spinner, HStack, Flex, Heading } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const WaitingConfirmationPage = () => {
  return (
    <Page>
      <Head>
        <title>Attente de confirmation d’email</title>
      </Head>
      <Flex minH="50vh" justifyContent="start" mt="10" flexDirection="column">
        <HStack>
          <Spinner mr={3} />
          <Heading fontSize="1rem" fontFamily="Marianne" fontWeight="500" marginBottom="2w">
            En attente de confirmation de votre compte utilisateur. Merci de vérifier vos emails.
          </Heading>
        </HStack>
      </Flex>
    </Page>
  );
};

export default WaitingConfirmationPage;
