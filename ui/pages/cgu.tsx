import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { Cgu } from "@/components/legal/Cgu";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const CguPage = () => {
  const title = "CONDITIONS GÉNÉRALES D'UTILISATION DU TABLEAU DE BORD DE L’APPRENTISSAGE";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Cgu />
      </Section>
    </Page>
  );
};

export default CguPage;
