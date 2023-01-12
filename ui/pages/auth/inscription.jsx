import React, { useState } from "react";
import Head from "next/head";
import { Flex, Text, Center, Heading } from "@chakra-ui/react";

import { Page } from "../../components/Page/Page";
import { Inscription } from "../../modules/auth/inscription/Inscription";

import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterPage = () => {
  const styleProps = {
    flexBasis: "50%",
    p: 12,
    justifyContent: "center",
  };

  const [succeeded, setSucceeded] = useState(false);

  return (
    <Page>
      <Head>
        <title>Inscription</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex w="full" maxW="xl" mt={4}>
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
      </Flex>
    </Page>
  );
};

export default RegisterPage;
