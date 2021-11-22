import { Heading } from "@chakra-ui/react";
import React from "react";

import { Page, Section } from "../../common/components";
import GlobalStats, { StatsSkeleton } from "../../common/components/GlobalStats";
import { useFetch } from "../../common/hooks/useFetch";

const GlobalStatsPage = () => {
  const [data, loading, error] = useFetch(`/api/stats`);

  let content;
  if (loading) content = <StatsSkeleton />;
  if (error) content = <p>Erreur lors du chargement des statistiques</p>;
  if (data && !loading) content = <GlobalStats stats={data.stats} networksStats={data.networksStats} />;

  return (
    <Page>
      <Section backgroundColor="galt" paddingY="4w" withShadow>
        <Heading as="h1" variant="h1">
          Statistiques globales
        </Heading>
      </Section>
      {content}
    </Page>
  );
};

export default GlobalStatsPage;
