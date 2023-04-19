import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import Login from "@/modules/auth/connexion/Connexion";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function ConnexionPage() {
  const title = "Connexion";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Login w={{ base: "100%", md: "60%", lg: "50%" }} mx="auto" border="1px solid" borderColor="openbluefrance" />
    </Page>
  );
}
