import { Skeleton, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import queryString from "query-string";
import React, { useEffect, useState } from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { _get } from "../../../httpClient";
import { omitNullishValues } from "../../../utils/omitNullishValues";
import FormationRow from "./FormationRow";

const buildSearchParams = (filters, niveauFormation) => {
  const date = filters.date.toISOString();

  return queryString.stringify(
    omitNullishValues({
      niveau_formation: niveauFormation,
      date,
      uai_etablissement: filters.cfa?.uai_etablissement ?? null,
      etablissement_reseaux: filters.reseau?.nom ?? null,
      etablissement_num_region: filters.region?.code ?? null,
      etablissement_num_departement: filters.departement?.code ?? null,
    })
  );
};

const FormationRowsLoading = () => {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => i).map((i) => {
        return (
          <Tr textAlign="left" key={i}>
            <Td>
              <Skeleton width="100%" height="1rem" startColor="grey.100" endColor="grey.400" />
            </Td>
            <Td>
              <Skeleton width="100%" height="1rem" startColor="grey.100" endColor="grey.400" />
            </Td>
            <Td>
              <Skeleton width="100%" height="1rem" startColor="grey.100" endColor="grey.400" />
            </Td>
            <Td>
              <Skeleton width="100%" height="1rem" startColor="grey.100" endColor="grey.400" />
            </Td>
          </Tr>
        );
      })}
    </>
  );
};

const FormationRows = ({ niveauFormation }) => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);

  const { state: filters } = useFiltersContext();
  const searchParamsString = buildSearchParams(filters, niveauFormation);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await _get(`/api/dashboard/effectifs-par-formation?${searchParamsString}`);
      setData(data);
      setLoading(false);
    };

    fetchData();
  }, [searchParamsString]);

  if (loading) {
    return <FormationRowsLoading />;
  }

  if (!data) return null;

  return (
    <>
      {data.map(({ formation_cfd, intitule, effectifs }) => {
        return (
          <FormationRow formationCfd={formation_cfd} intitule={intitule} effectifs={effectifs} key={formation_cfd} />
        );
      })}
    </>
  );
};

FormationRows.propTypes = {
  niveauFormation: PropTypes.string.isRequired,
};

export default FormationRows;
