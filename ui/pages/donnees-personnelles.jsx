import React from "react";
import Head from "next/head";

import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import DonneesPersonnelles from "@/components/legal/DonneesPersonnelles";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => {
  return { props: { ...(await getAuthServerSideProps(context)) } };
};

const DonneesPersonnellesPage = () => {
  const title = "Données Personnelles";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <DonneesPersonnelles />
      </Section>
    </Page>
  );
};

export default DonneesPersonnellesPage;
