import { Box, Heading } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import GlobalStats from "../../common/components/GlobalStats";
import { useFetch } from "../../common/hooks/useFetch";

const GlobalStatsPage = () => {
  const [data, loading, error] = useFetch(`/api/stats`);

  if (loading) return <p>Chargement des données...</p>;
  if (error) return <p>Erreur lors du chargement des statistiques</p>;

  return (
    data && (
      <Box>
        <Heading fontSize="alpha" fontWeight="400" as="h1" mb="1v" mt="9w">
          Statistiques globales
        </Heading>
        <GlobalStats stats={data.stats} />
      </Box>
    )
  );
};

GlobalStatsPage.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GlobalStatsPage;
