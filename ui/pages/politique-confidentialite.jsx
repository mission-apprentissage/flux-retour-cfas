import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "../common/SSR/getAuthServerSideProps";
import { Page, Section } from "../components";
import { Breadcrumb } from "../components/Breadcrumb/Breadcrumb";
import PolitiqueDeConfidentialite from "../components/legal/PolitiqueDeConfidentialite";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PolitiqueDeConfidentialitePage = () => {
  const title = "Politique de confidentialite";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Section>
        <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
        <PolitiqueDeConfidentialite />
      </Section>
    </Page>
  );
};

export default PolitiqueDeConfidentialitePage;
