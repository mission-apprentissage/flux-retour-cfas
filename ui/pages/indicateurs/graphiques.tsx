import { Container, Heading } from "@chakra-ui/react";
import { sign } from "jsonwebtoken";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import { AuthContext } from "@/common/internal/AuthContext";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";

export const getServerSideProps: GetServerSideProps<{ iframeUrl: string; auth: any }> = async (context) => {
  const { auth } = (await getAuthServerSideProps(context)) as { auth: AuthContext };

  const METABASE_SITE_URL = process.env.METABASE_SITE_URL;
  const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY;

  const payload = {
    resource: { dashboard: 86 },
    params: {
      region: (auth.organisation as any).code_region ?? [],
      departement: (auth.organisation as any).code_departement ?? [],
      academie: (auth.organisation as any).code_academie ?? [],
    },
    exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 minute expiration
  };
  const token = sign(payload, METABASE_SECRET_KEY);

  const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`;

  return { props: { iframeUrl, auth } };
};

function IndicateursGraphiquesPage({ iframeUrl }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <SimplePage>
      <Head>
        <title>Mes indicateurs - graphiques</title>
      </Head>

      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Mes indicateurs
        </Heading>
        <iframe src={iframeUrl} frameBorder="0" style={{ height: "1000px", width: "100%" }} allowtransparency="true" />
      </Container>
    </SimplePage>
  );
}

export default withAuth(IndicateursGraphiquesPage);
