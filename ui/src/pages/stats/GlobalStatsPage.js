import React from "react";

import { Page, PageContent, PageHeader, PageSkeleton } from "../../common/components";
import GlobalStats from "../../common/components/GlobalStats";
import { useFetch } from "../../common/hooks/useFetch";

const GlobalStatsPage = () => {
  const [data, loading, error] = useFetch(`/api/stats`);

  let content;
  if (loading) content = <PageSkeleton />;
  if (error) content = <p>Erreur lors du chargement des statistiques</p>;
  if (data) content = <GlobalStats stats={data.stats} lastImportDates={data.lastImportDates} />;

  return (
    <Page>
      <PageHeader title="Statistiques globales" />
      <PageContent>{content}</PageContent>
    </Page>
  );
};

export default GlobalStatsPage;
