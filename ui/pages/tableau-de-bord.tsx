import Head from "next/head";
import React from "react";

import Page from "@/components/Page/Page";
import DashboardTransverse from "@/modules/mon-espace/landing/DashboardTransverse";

function DashboardPage() {
  return (
    <Page>
      <Head>
        <title>Mon tableau de bord</title>
      </Head>
      <DashboardTransverse />
    </Page>
  );
}

export default DashboardPage;
