import React from "react";
import Head from "next/head";
import { Heading } from "@chakra-ui/react";
import { Page, Section } from "../components";
import { Breadcrumb } from "../components/Breadcrumb/Breadcrumb";
import DonneesPersonnelles from "../components/legal/DonneesPersonnelles";
import { getAuthServerSideProps } from "../common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => {
  return { props: { ...(await getAuthServerSideProps(context)) } };
};

const DonneesPersonnellesPage = () => {
  const title = "Données Personnelles";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Section>
        <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />

        <DonneesPersonnelles />
      </Section>
    </Page>
  );
};

export default DonneesPersonnellesPage;
