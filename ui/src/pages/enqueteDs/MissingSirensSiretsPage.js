import React from "react";
import { Page, Site, Nav, Grid, Header, Alert, StampCard } from "tabler-react";
import { useFetch } from "../../common/hooks/useFetch";
import Layout from "../layout/Layout";

export default () => {
  const [data, loading] = useFetch("api/statsDs");

  return (
    <Layout>
      <Page>
        <Page.Main>
          <Page.Content title="Enquete Ds - Sirens & Sirets manquants">
            {loading && "Chargement des données..."}
            {data && (
              <>
                {/* Sirets manquants */}
                <Header.H5>Sirets manquants </Header.H5>
              </>
            )}
          </Page.Content>
        </Page.Main>
      </Page>
    </Layout>
  );
};
