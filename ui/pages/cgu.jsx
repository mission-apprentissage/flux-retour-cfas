import Head from "next/head";
import React from "react";

import { NAVIGATION_PAGES } from "../common/constants/navigationPages.js";
import { getAuthServerSideProps } from "../common/SSR/getAuthServerSideProps";
import { Page, Section } from "../components";
import { Breadcrumb } from "../components/Breadcrumb/Breadcrumb";
import { Cgu } from "../components/legal/Cgu";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const CguPage = () => {
  const title = NAVIGATION_PAGES.CGU.title;
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Section>
        <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
        <Cgu />
      </Section>
    </Page>
  );
};

export default CguPage;
