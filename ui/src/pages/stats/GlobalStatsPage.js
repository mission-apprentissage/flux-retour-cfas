import { Box, Flex } from "@chakra-ui/react";
import React from "react";

import GlobalStats from "../../common/components/GlobalStats";
import LoggedUserMenu from "../../common/components/LoggedUserMenu";
import PageSkeleton from "../../common/components/PageSkeleton";
import PageTitle from "../../common/components/PageTitle";
import { useFetch } from "../../common/hooks/useFetch";

const GlobalStatsPage = () => {
  const [data, loading, error] = useFetch(`/api/stats`);

  let content;
  if (loading) content = <PageSkeleton />;
  if (error) content = <p>Erreur lors du chargement des statistiques</p>;
  if (data) content = <GlobalStats stats={data.stats} lastImportDates={data.lastImportDates} />;

  return (
    <Box width="100%">
      <Box background="bluegrey.100" padding="4w">
        <Flex flexDirection="row-reverse">
          <LoggedUserMenu />
        </Flex>
        <PageTitle>Statistiques globales</PageTitle>
      </Box>
      <Box paddingX="8w" paddingY="5w">
        {content}
      </Box>
    </Box>
  );
};

export default GlobalStatsPage;
