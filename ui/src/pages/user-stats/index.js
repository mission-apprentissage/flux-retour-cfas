import PropTypes from "prop-types";
import React from "react";
import { Page } from "tabler-react";

import CandidatsStats from "../../common/components/CandidatsStats";
import { useFetch } from "../../common/hooks/useFetch";
import Layout from "../layout/Layout";

const UserStatsPage = ({ match }) => {
  const [data, loading, error] = useFetch(`/api/stats/${match.params.dataSource}`);

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

UserStatsPage.propTypes = {
  // from react-router's Route component
  match: PropTypes.shape({
    params: PropTypes.shape({
      dataSource: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default UserStatsPage;
