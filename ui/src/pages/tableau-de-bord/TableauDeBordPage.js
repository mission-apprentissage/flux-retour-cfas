import React from "react";

import { FiltersProvider, useFiltersContext } from "./FiltersContext";
import useEffectifs from "./useEffectifs";
import { CfaView, DepartementView, FormationView, RegionView, ReseauView } from "./views";

export const TableauDeBordView = () => {
  const [effectifs, loading, error] = useEffectifs();
  const { state: filters } = useFiltersContext();

  if (filters.cfa) {
    return (
      <CfaView
        cfaUai={filters.cfa.uai_etablissement}
        filters={filters}
        effectifs={effectifs}
        loading={loading}
        error={error}
      />
    );
  }

  if (filters.reseau) {
    return <ReseauView effectifs={effectifs} loading={loading} filters={filters} reseau={filters.reseau.nom} />;
  }

  if (filters.formation) {
    return (
      <FormationView formationCfd={filters.formation.cfd} loading={loading} filters={filters} effectifs={effectifs} />
    );
  }

  if (filters.region) {
    return <RegionView effectifs={effectifs} loading={loading} filters={filters} />;
  }

  return <DepartementView filters={filters} effectifs={effectifs} loading={loading} error={error} />;
};

const TableauDeBordPage = () => {
  return (
    <FiltersProvider>
      <TableauDeBordView />
    </FiltersProvider>
  );
};

export default TableauDeBordPage;
