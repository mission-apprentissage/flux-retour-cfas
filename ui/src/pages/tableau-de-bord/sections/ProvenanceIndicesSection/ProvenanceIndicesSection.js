import { Box, Skeleton, Text } from "@chakra-ui/react";
import React from "react";
import { useQuery } from "react-query";

import { fetchTotalOrganismes } from "../../../../common/api/tableauDeBord";
import Section from "../../../../common/components/Section/Section";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { formatNumber } from "../../../../common/utils/stringUtils";
import { useFiltersContext } from "../../FiltersContext";

const ProvenanceIndicesSection = () => {
  const { state: filters } = useFiltersContext();
  const requestFilters = pick(mapFiltersToApiFormat(filters), [
    "etablissement_num_region",
    "etablissement_num_departement",
    "etablissement_reseaux",
    "formation_cfd",
  ]);
  const { data, isLoading, error } = useQuery(["total-organismes", requestFilters], () =>
    fetchTotalOrganismes(requestFilters)
  );

  let content = null;

  if (isLoading) {
    content = <Skeleton startColor="grey.200" endColor="grey.600" width="30rem" height="1rem" />;
  }
  if (data?.nbOrganismes) {
    content = (
      <Text color="grey.600" fontWeight="400" fontSize="omega">
        Les indices affichés sont calculés grâce aux {formatNumber(data.nbOrganismes)} organismes qui ont transmis leurs
        données
      </Text>
    );
  }
  if (error) {
    content = (
      <Text fontSize="omega" color="warning">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors du chargement de la provenance des indices
        </Box>
      </Text>
    );
  }

  return <Section paddingY="1w">{content}</Section>;
};

export default ProvenanceIndicesSection;
