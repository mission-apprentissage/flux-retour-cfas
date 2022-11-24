import React from "react";
import {
  Box,
  Container,
  // Image,
  Heading,
} from "@chakra-ui/react";
import Head from "next/head";
import { Breadcrumb } from "../../../components/Breadcrumb/Breadcrumb";
import { Page } from "../../../components/Page/Page";

import withAuth from "../../../components/withAuth";
import { getAuthServerSideProps } from "../../../common/SSR/getAuthServerSideProps";
import { useEspace } from "../../../hooks/useEspace";
import EnqueteSIFA from "../../../modules/mon-espace/SIFA/EnqueteSIFA";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const MonEspace = () => {
  let {
    isMonOrganismePage,
    isOrganismePages,
    isEffectifsPage,
    isSIFA2Page,
    isParametresPage,
    organisme_id,
    breadcrumb,
  } = useEspace();

  return (
    <Page>
      <Head>
        <title>Mon espace</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb pages={breadcrumb} />
          <Box mt={4}>
            {isMonOrganismePage && (
              <>
                <Heading textStyle="h2" color="grey.800" mt={5}>
                  Bienvenue sur votre tableau de bord
                </Heading>
                {/* <Image src="/images/fake/tdbOF.png" alt="fake tdb of" w="full" mt={3} /> */}
                {/* <Image src="/images/fake/tdbReseau.png" alt="fake tdb reseau" w="full" mt={3} /> */}
              </>
            )}
            {isOrganismePages && !isEffectifsPage && !isSIFA2Page && !isParametresPage && organisme_id && (
              <>
                {/* TODO USEORGANISME */}
                <Heading textStyle="h2" color="grey.800" mt={5}>
                  Bienvenue sur le tableau de bord de &quot;Aden formation Caen&quot;
                </Heading>
                {/* <Image src="/images/fake/tdbOF.png" alt="fake tdb of" w="full" mt={3} /> */}
                {/* <Image src="/images/fake/tdbReseau.png" alt="fake tdb reseau" w="full" mt={3} /> */}
              </>
            )}
            {isEffectifsPage && (
              <Heading textStyle="h2" color="grey.800" mt={5}>
                Mes Effectifs
              </Heading>
            )}
            {isSIFA2Page && (
              <>
                <Heading textStyle="h2" color="grey.800" mt={5}>
                  Mon Enquete SIFA2
                </Heading>
                <EnqueteSIFA />
              </>
            )}
            {isParametresPage && (
              <Heading textStyle="h2" color="grey.800" mt={5}>
                Paramètres de mon organisme
              </Heading>
            )}
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(MonEspace);
