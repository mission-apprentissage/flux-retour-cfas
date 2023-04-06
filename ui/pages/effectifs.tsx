import React, { useEffect } from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import EffectifsPage from "@/modules/mon-espace/effectifs/EffectifsPage";
import { useRecoilState } from "recoil";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { useOrganisationOrganisme } from "@/hooks/organismes";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeMonOrganisme = () => {
  const title = "Mes effectifs";

  const { organisme } = useOrganisationOrganisme();
  const [organismeState, setMyOrganisme] = useRecoilState(organismeAtom);
  useEffect(() => {
    setMyOrganisme(organisme);
  }, [organismeState]);

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Box mt={4}>{organismeState && <EffectifsPage isMine={true} />}</Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageEffectifsDeMonOrganisme);
