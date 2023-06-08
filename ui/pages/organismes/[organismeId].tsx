import { Box, Container, Heading, Stack } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { useOrganisme } from "@/hooks/organismes";
import OrganismeInfo from "@/modules/dashboard/OrganismeInfo";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const DashboardOrganisme = () => {
  const router = useRouter();
  const { organisme } = useOrganisme(router.query.organismeId as string);
  return (
    <Page>
      <Head>
        <title>Tableau de bord {organisme?.enseigne || organisme?.raison_sociale}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          <Stack spacing="2w">
            <Heading textStyle="h2" color="grey.800">
              Bienvenue sur le tableau de bord de :
            </Heading>
            {organisme && <OrganismeInfo organisme={organisme} isMine={false} />}
          </Stack>
        </Container>
      </Box>
    </Page>
  );
};

export default withAuth(DashboardOrganisme);
