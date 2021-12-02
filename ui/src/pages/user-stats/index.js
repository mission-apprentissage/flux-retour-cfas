import { Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Page, Section } from "../../common/components";
import GlobalStats, { StatsSkeleton } from "../../common/components/GlobalStats";
import { useFetch } from "../../common/hooks/useFetch";

const UserStatsPage = ({ match }) => {
  const userName = match.params.dataSource;
  const [data, loading, error] = useFetch(`/api/stats/${userName}`);

  let content;
  if (data && !loading) content = <GlobalStats stats={data.stats} />;
  if (error) content = <p>Erreur lors du chargement des statistiques {userName}</p>;
  if (loading) content = <StatsSkeleton />;

  return (
    <Page>
      <Section backgroundColor="galt" paddingY="4w" withShadow>
        <Heading as="h1" variant="h1">
          Statistiques {userName}
        </Heading>
      </Section>
      {content}
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
