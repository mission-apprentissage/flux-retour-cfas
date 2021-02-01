import PropTypes from "prop-types";
import React from "react";

import { Page, PageContent, PageHeader, PageSkeleton } from "../../common/components";
import GlobalStats from "../../common/components/GlobalStats";
import { useFetch } from "../../common/hooks/useFetch";

const UserStatsPage = ({ match }) => {
  const userName = match.params.dataSource;
  const [data, loading, error] = useFetch(`/api/stats/${userName}`);

  let content;
  if (data) content = <GlobalStats stats={data.stats} />;
  if (error) content = <p>Erreur lors du chargement des statistiques {userName}</p>;
  if (loading) content = <PageSkeleton />;

  return (
    <Page>
      <PageHeader title={`Statistiques ${userName}`} />
      <PageContent>{content}</PageContent>
    </Page>
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
