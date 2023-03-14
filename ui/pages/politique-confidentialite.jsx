import React from "react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import PolitiqueDeConfidentialite from "@/components/legal/PolitiqueDeConfidentialite";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PolitiqueDeConfidentialitePage = () => {
  const title = "Politique de confidentialite";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Breadcrumb pages={[PAGES.homepage(), { title }]} />
        <PolitiqueDeConfidentialite />
      </Section>
    </Page>
  );
};

export default PolitiqueDeConfidentialitePage;
