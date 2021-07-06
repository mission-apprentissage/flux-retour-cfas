import { Box, Skeleton, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

import Section from "../../common/components/Section/Section";
import { _post } from "../../common/httpClient";
import { omitNullishValues } from "../../common/utils/omitNullishValues";
import { useFiltersContext } from "./FiltersContext";

const buildRequestBody = (filters) => {
  const flattenedFilters = {
    etablissement_num_region: filters.region?.code ?? null,
    etablissement_num_departement: filters.departement?.code ?? null,
    formation_cfd: filters.formation?.cfd ?? null,
    etablissement_reseaux: filters.reseau?.nom ?? null,
  };

  return omitNullishValues(flattenedFilters);
};

const IndicesProvenanceSection = () => {
  const { state: filters } = useFiltersContext();
  const [totalOrganismes, setTotalOrganismes] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await _post("/api/dashboard/total-organismes", buildRequestBody(filters));
        setTotalOrganismes(response.nbOrganismes);
        setError(null);
      } catch (err) {
        setError(err);
        setTotalOrganismes(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  let content = null;
  if (loading) {
    content = <Skeleton startColor="grey.200" endColor="grey.600" width="30rem" height="1rem" />;
  }
  if (totalOrganismes != null && !loading) {
    content = (
      <Text color="grey.600" fontWeight="400" fontSize="omega">
        Les indices affichés sont calculés grâce aux {totalOrganismes} organismes qui ont transmis leurs données
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

export default IndicesProvenanceSection;
