import { Box, Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import GlobalStats from "../../common/components/GlobalStats";
import { useFetch } from "../../common/hooks/useFetch";

const UserStatsPage = ({ match }) => {
  const userName = match.params.dataSource;
  const [data, loading, error] = useFetch(`/api/stats/${userName}`);

  if (loading) return <p>Chargement des données...</p>;
  if (error) return <p>Erreur lors du chargement des statistiques {userName}</p>;

  return (
    data && (
      <Box>
        <Heading fontSize="alpha" fontWeight="400" as="h1" mb="1v" mt="9w">
          Statistiques {userName}
        </Heading>
        <GlobalStats stats={data.stats} />
      </Box>
    )
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
