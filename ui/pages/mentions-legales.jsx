import React from "react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import Breadcrumb, { PAGES } from "@/components/Breadcrumb/Breadcrumb";
import MentionsLegales from "@/components/legal/MentionsLegales";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const MentionsLegalesPage = () => {
  const title = "Mentions légales";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Breadcrumb pages={[PAGES.homepage(), { title }]} />
        <MentionsLegales />
      </Section>
    </Page>
  );
};

export default MentionsLegalesPage;
