import React from "react";
import { Box, Image, Heading } from "@chakra-ui/react";
import Head from "next/head";
// import { Breadcrumb } from "../../../components/Breadcrumb/Breadcrumb";
import { Page } from "../../../components/Page/Page";

import withAuth from "../../../components/withAuth";
import { getAuthServerSideProps } from "../../../common/SSR/getAuthServerSideProps";
import { useOrganisme } from "../../../hooks/useOrganisme";
import EnqueteSIFA from "../../../modules/mon-espace/SIFA/EnqueteSIFA";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const MesDossiers = () => {
  let {
    isMonOrganismePage,
    isOrganismePages,
    isEffectifsPage,
    isSIFA2Page,
    isParametresPage,
    organisme_id,
    organisme,
    isLoading,
  } = useOrganisme();

  console.log({
    organisme,
    isLoading,
  });

  return (
    <Page>
      <Head>
        <title>Mon espace</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <Breadcrumb pages={breadcrumbDetails} loading={!isReloaded} /> */}
      <Box mt={4}>
        {isMonOrganismePage && (
          <>
            <Heading textStyle="h2" color="grey.800" mt={5}>
              Bienvenue sur votre tableau de bord
            </Heading>
            <Image src="/images/fake/tdbOF.png" alt="fake tdb of" w="full" mt={3} />
            {/* <Image src="/images/fake/tdbReseau.png" alt="fake tdb reseau" w="full" mt={3} /> */}
          </>
        )}
        {isOrganismePages && !isEffectifsPage && !isSIFA2Page && !isParametresPage && organisme_id && (
          <>
            <Heading textStyle="h2" color="grey.800" mt={5}>
              Bienvenue sur le tableau de bord de &quot;Aden formation Caen&quot;
            </Heading>
            <Image src="/images/fake/tdbOF.png" alt="fake tdb of" w="full" mt={3} />
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
    </Page>
  );
};

export default withAuth(MesDossiers);
