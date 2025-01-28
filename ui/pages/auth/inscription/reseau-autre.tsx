import { Text, Center, Heading, HStack, Box, Image } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Link from "@/components/Links/Link";
import Page from "@/components/Page/Page";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ReseauAutre = () => {
  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Center w="full" flexDirection="column" border="1px solid" borderColor="openbluefrance" p={12}>
        <Image src="/images/supportOutline_III.svg" alt="felicitation" />
        <Heading as="h2" fontSize="2xl" my={[3, 6]}>
          La création de votre compte n’a pu aboutir (pour le moment).
        </Heading>
        <Text textAlign="center">
          Le réseau indiqué n’est actuellement pas encore référencé sur le tableau de bord.
          <br />
          L’équipe du tableau de bord reviendra vers vous pour investiguer et finaliser la création de votre compte.{" "}
          <br />
          Merci de votre patience et de l’intérêt que vous portez au tableau de bord de l’apprentissage.
        </Text>
        <HStack>
          <Link href="/" color="bluefrance" isUnderlined mt={8}>
            <Box as="i" className="ri-arrow-left-line" marginRight="1w" />
            Retour à l’accueil
          </Link>
        </HStack>
      </Center>
    </Page>
  );
};

export default ReseauAutre;
