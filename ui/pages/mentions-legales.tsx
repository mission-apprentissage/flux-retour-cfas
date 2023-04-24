import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import MentionsLegales from "@/components/legal/MentionsLegales";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";

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
