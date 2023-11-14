import { Text, Center, Heading, HStack, Box } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Link from "@/components/Links/Link";
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
        <img src="/images/supportOutline_III.svg" alt="felicitation" />
        <Heading as="h2" fontSize="2xl" my={[3, 6]}>
          La création de votre compte n&apos;a pu aboutir (pour le moment).
        </Heading>
        <Text textAlign="center">
          Le réseau indiqué n&apos;est actuellement pas encore référencé sur le tableau de bord.
          <br />
          L&apos;équipe du tableau de bord reviendra vers vous pour investiguer et finaliser la création de votre
          compte. <br />
          Merci de votre patience et de l&apos;intérêt que vous portez au tableau de bord de l&apos;apprentissage.
        </Text>
        <HStack>
          <Link
            href="/"
            color="bluefrance"
            borderBottom="1px solid"
            mt={8}
            _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
          >
            <Box as="i" className="ri-arrow-left-line" marginRight="1w" />
            Retour à l’accueil
          </Link>
        </HStack>
      </Center>
    </Page>
  );
};

export default BravoPage;
