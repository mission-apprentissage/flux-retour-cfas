import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import PolitiqueDeConfidentialite from "@/components/legal/PolitiqueDeConfidentialite";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PolitiqueDeConfidentialitePage = () => {
  const title = "Politique de confidentialite";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <PolitiqueDeConfidentialite />
      </Section>
    </Page>
  );
};

export default PolitiqueDeConfidentialitePage;
