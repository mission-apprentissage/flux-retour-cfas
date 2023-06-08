import { Box, Container } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import SIFAPage from "@/modules/mon-espace/SIFA/SIFAPage";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEnqueteSIFADeSonOrganisme = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganisme(router.query.organismeId as string);

  return (
    <Page>
      <Head>
        <title>Mon enquête SIFA</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          {organisme && <SIFAPage isMine={false} />}
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(PageEnqueteSIFADeSonOrganisme, [
  "ORGANISME_FORMATION_FORMATEUR",
  "ORGANISME_FORMATION_RESPONSABLE",
  "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
  "ADMINISTRATEUR",
]);
