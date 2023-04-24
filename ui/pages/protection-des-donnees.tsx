import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import PolitiqueDeConfidentialite from "@/components/legal/PolitiqueDeConfidentialite";
import Page from "@/components/Page/Page";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ProtectionDesDonneesPage = () => {
  const title = "Politique de confidentialite";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <PolitiqueDeConfidentialite />
    </Page>
  );
};

export default ProtectionDesDonneesPage;
