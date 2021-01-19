import { Box, Flex } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import GlobalStats from "../../common/components/GlobalStats";
import LoggedUserMenu from "../../common/components/LoggedUserMenu";
import PageSkeleton from "../../common/components/PageSkeleton";
import PageTitle from "../../common/components/PageTitle";
import { useFetch } from "../../common/hooks/useFetch";

const UserStatsPage = ({ match }) => {
  const userName = match.params.dataSource;
  const [data, loading, error] = useFetch(`/api/stats/${userName}`);

  let content;
  if (data) content = <GlobalStats stats={data.stats} />;
  if (error) content = <p>Erreur lors du chargement des statistiques {userName}</p>;
  if (loading) content = <PageSkeleton />;

  return (
    <Box width="100%">
      <Box background="bluegrey.100" padding="4w">
        <Flex flexDirection="row-reverse">
          <LoggedUserMenu />
        </Flex>
        <PageTitle>Statistiques {userName}</PageTitle>
      </Box>
      <Box paddingX="8w" paddingY="5w">
        {content}
      </Box>
    </Box>
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
