import React from "react";
import Head from "next/head";
import {
  Box,
  Container,
  Heading,
  Image,
  // Text
} from "@chakra-ui/react";
import { Page } from "../../../components";
import { Breadcrumb } from "../../../components/Breadcrumb/Breadcrumb";
// import ViewSelection from "../../../modules/visualiser-les-indicateurs/ViewSelection";

import { getAuthServerSideProps } from "../../../common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function MonTableauDeBord() {
  const title = "Informations sur mon organisme";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb
            pages={[
              { title: "Mon espace", to: "/mon-espace/mon-organisme" },
              // { title: title }
            ]}
          />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            Bienvenue sur votre tableau de bord
          </Heading>
          {/* <Text marginTop="3v" fontSize="gamma" color="grey.800">
            Quelle vue souhaitez-vous afficher ?
          </Text>
          <ViewSelection /> */}
          <Image src="/images/fake/tdbOF.png" alt="fake tdb of" w="full" mt={3} />
          {/* <Image src="/images/fake/tdbReseau.png" alt="fake tdb reseau" w="full" mt={3} /> */}
        </Container>
      </Box>
    </Page>
  );
}
