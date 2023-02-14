import React from "react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import MentionsLegales from "@/components/legal/MentionsLegales";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { NAVIGATION_PAGES } from "@/common/constants/navigationPages.js";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const MentionsLegalesPage = () => {
  const title = NAVIGATION_PAGES.MentionsLegales.title;
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
        <MentionsLegales />
      </Section>
    </Page>
  );
};

export default MentionsLegalesPage;
