import Head from "next/head";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import EffectifsPage from "@/modules/mon-espace/effectifs/EffectifsPage";
import { useEffectifsOrganismeOrganisation } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeMonOrganisme = () => {
  const title = "Mes effectifs";

  const { organisme } = useEffectifsOrganismeOrganisation();

  return (
    <Page childrenContainer="div">
      <Head>
        <title>{title}</title>
      </Head>
      <EffectifsPage isMine={true} organisme={organisme} />
    </Page>
  );
};

export default withAuth(PageEffectifsDeMonOrganisme);
