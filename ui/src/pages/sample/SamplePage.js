import React from "react";
import { Page } from "tabler-react";
import Layout from "../layout/Layout";

export default () => {
  return (
    <Layout>
      <Page>
        <Page.Main>
          <Page.Content title="Sample"></Page.Content>
        </Page.Main>
      </Page>
    </Layout>
  );
};
