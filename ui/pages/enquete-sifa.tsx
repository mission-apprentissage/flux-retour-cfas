import React, { useEffect } from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import Page from "@/components/Page/Page";

import { useOrganisationOrganisme } from "@/hooks/organismes";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SIFAPage from "@/modules/mon-espace/SIFA/SIFAPage";
import { useRecoilState } from "recoil";
import { organismeAtom } from "@/hooks/organismeAtoms";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEnqueteSIFADeMonOrganisme = () => {
  const title = "Mon enquête SIFA";

  const { organisme } = useOrganisationOrganisme();
  const [organismeState, setMyOrganisme] = useRecoilState(organismeAtom);
  useEffect(() => {
    setMyOrganisme(organisme);
  }, [organisme]);

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Box mt={4}>{organismeState && <SIFAPage isMine />}</Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageEnqueteSIFADeMonOrganisme, [
  "ORGANISME_FORMATION_FORMATEUR",
  "ORGANISME_FORMATION_RESPONSABLE",
  "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
]);
