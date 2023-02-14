import React from "react";
import Head from "next/head";

import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { Cgu } from "@/components/legal/Cgu";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { NAVIGATION_PAGES } from "@/common/constants/navigationPages.js";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const CguPage = () => {
  const title = NAVIGATION_PAGES.CGU.title;
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
        <Cgu />
      </Section>
    </Page>
  );
};

export default CguPage;
