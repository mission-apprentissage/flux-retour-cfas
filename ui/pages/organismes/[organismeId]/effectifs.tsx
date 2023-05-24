import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import EffectifsPage from "@/modules/mon-espace/effectifs/EffectifsPage";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageEffectifsDeSonOrganisme = () => {
  const router = useRouter();
  const { organisme } = useEffectifsOrganisme(router.query.organismeId as string);

  return (
    <Page>
      <Head>
        <title>Ses effectifs</title>
      </Head>
      <EffectifsPage isMine={false} organisme={organisme} />
    </Page>
  );
};

export default withAuth(PageEffectifsDeSonOrganisme);
