import React from "react";
import { Page } from "tabler-react";
import CandidatsStats from "../../common/components/CandidatsStats";
import { useFetch } from "../../common/hooks/useFetch";
import Layout from "../layout/Layout";

const DashboardPage = () => {
  const [data, loading, error] = useFetch("/api/stats");

  return (
    <Layout>
      <Page>
        <Page.Main>
          <Page.Content title="Tableau de bord">
            {loading && <p>Chargement des données...</p>}
            {error && <p>Erreur lors du chargement des statistiques</p>}
            {data && <CandidatsStats stats={data.stats} />}
          </Page.Content>
        </Page.Main>
      </Page>
    </Layout>
  );
};

export default DashboardPage;
