import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import { Breadcrumb } from "../../../components/Breadcrumb/Breadcrumb";
import { Page } from "../../../components/Page/Page";

import withAuth from "../../../components/withAuth";
import { getAuthServerSideProps } from "../../../common/SSR/getAuthServerSideProps";
import { useEspace } from "../../../hooks/useEspace";
import SIFAPage from "../../../modules/mon-espace/SIFA/SIFAPage";
import { useOrganisme } from "../../../hooks/useOrganisme";
import LandingOrganisme from "../../../modules/mon-espace/landing/LandingOrganisme/LandingOrganisme";
import { hasContextAccessTo } from "../../../common/utils/rolesUtils";
import EffectifsPage from "../../../modules/mon-espace/effectifs/EffectifsPage";
import ParametresOrganisme from "../../../modules/mon-espace/parametres/parametresOrganisme";
import LandingErp from "../../../modules/mon-espace/landing/LandingErp";
import LandingTransverse from "../../../modules/mon-espace/landing/LandingTransverse";
import LandingReseau from "../../../modules/mon-espace/landing/LandingReseau.jsx";
import LandingPilot from "../../../modules/mon-espace/landing/LandingPilot.jsx";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const MonEspace = () => {
  let {
    isMonOrganismePage,
    isMonOrganismePages,
    isOrganismePages,
    isEffectifsPage,
    isSIFAPage,
    isParametresPage,
    breadcrumb,
    myOrganisme,
    whoIs,
  } = useEspace();

  const { organisme } = useOrganisme(); // TODO A lot of re-render ~15

  const currentOrganisme = isMonOrganismePages ? myOrganisme : isOrganismePages ? organisme : null;

  return (
    <Page>
      <Head>
        <title>Mon espace</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Breadcrumb pages={breadcrumb} />
          <Box mt={4}>
            {isMonOrganismePage && !currentOrganisme && whoIs === "reseau_of" && <LandingReseau />}
            {isMonOrganismePage && !currentOrganisme && whoIs === "pilot" && <LandingPilot />}
            {isMonOrganismePage && !currentOrganisme && whoIs === "erp" && <LandingErp />}
            {isMonOrganismePage && !currentOrganisme && !whoIs && <LandingTransverse />}

            {(isMonOrganismePage || isOrganismePages) &&
              currentOrganisme &&
              !isEffectifsPage &&
              !isSIFAPage &&
              !isParametresPage &&
              hasContextAccessTo(currentOrganisme, "organisme/tableau_de_bord") && <LandingOrganisme />}
            {isEffectifsPage &&
              currentOrganisme &&
              hasContextAccessTo(currentOrganisme, "organisme/page_effectifs") && <EffectifsPage />}
            {isSIFAPage && currentOrganisme && hasContextAccessTo(currentOrganisme, "organisme/page_sifa") && (
              <SIFAPage />
            )}
            {isParametresPage &&
              currentOrganisme &&
              hasContextAccessTo(currentOrganisme, "organisme/page_parametres") && (
                <ParametresOrganisme organisme={currentOrganisme} />
              )}
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(MonEspace);
