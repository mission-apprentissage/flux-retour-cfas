import { Box, Skeleton, Text } from "@chakra-ui/react";
import qs from "query-string";
import React from "react";

import Section from "../../../../common/components/Section/Section";
import { useFetch } from "../../../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { formatNumber } from "../../../../common/utils/stringUtils";
import { useFiltersContext } from "../../FiltersContext";

const buildRequestQuery = (filters) => {
  return qs.stringify(
    pick(mapFiltersToApiFormat(filters), [
      "etablissement_num_region",
      "etablissement_num_departement",
      "etablissement_reseaux",
      "formation_cfd",
    ])
  );
};

const ProvenanceIndicesSection = () => {
  const { state: filters } = useFiltersContext();
  const [data, loading, error] = useFetch(`/api/dashboard/total-organismes?${buildRequestQuery(filters)}`);

  let content = null;
  if (loading) {
    content = <Skeleton startColor="grey.200" endColor="grey.600" width="30rem" height="1rem" />;
  }
  if (data?.nbOrganismes != null && !loading) {
    content = (
      <Text color="grey.600" fontWeight="400" fontSize="omega">
        Les indices affichés sont calculés grâce aux {formatNumber(data.nbOrganismes)} organismes qui ont transmis leurs
        données
      </Text>
    );
  }
  if (error && !loading) {
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
