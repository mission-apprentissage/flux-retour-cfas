import React from "react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
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
        <MentionsLegales />
      </Section>
    </Page>
  );
};

export default MentionsLegalesPage;
