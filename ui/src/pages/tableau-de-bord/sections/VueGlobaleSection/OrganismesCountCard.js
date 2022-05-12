import { Skeleton } from "@chakra-ui/react";
import React from "react";
import { useQuery } from "react-query";

import { fetchTotalOrganismes } from "../../../../common/api/tableauDeBord";
import { EffectifCard } from "../../../../common/components";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { useFiltersContext } from "../../FiltersContext";

const OrganismesCountCard = () => {
  const { state: filters } = useFiltersContext();
  const requestFilters = pick(mapFiltersToApiFormat(filters), [
    "etablissement_num_region",
    "etablissement_num_departement",
    "etablissement_reseaux",
    "formation_cfd",
  ]);
  const { data, isLoading } = useQuery(["total-organismes", requestFilters], () =>
    fetchTotalOrganismes(requestFilters)
  );

  if (isLoading) {
    return <Skeleton width="16rem" height="136px" startColor="grey.300" endColor="galt" />;
  }
  if (data) {
    return (
      <EffectifCard
        count={data.nbOrganismes}
        label="organismes de formation"
        tooltipLabel="Nombre d’organismes de formation qui transmettent leurs données au Tableau de bord de l’apprentissage. Un organisme est identifié par une UAI utilisant 1 ou plusieurs numéro(s) SIRET."
        iconClassName="ri-home-6-fill"
        accentColor="#417DC4"
      />
    );
  }

  return null;
};

export default OrganismesCountCard;
