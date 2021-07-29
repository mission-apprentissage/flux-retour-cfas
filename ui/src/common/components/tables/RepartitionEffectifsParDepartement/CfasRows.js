import { Skeleton, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { usePostFetch } from "../../../hooks/useFetch";
import { omitNullishValues } from "../../../utils/omitNullishValues";
import CfaRow from "./CfaRow";

const CfasRowsLoading = () => {
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

const CfasRows = ({ departementCode }) => {
  const { state: filters } = useFiltersContext();
  const requestBody = omitNullishValues({
    date: filters.date.toISOString(),
    etablissement_num_departement: departementCode,
  });
  const [data, loading] = usePostFetch("/api/dashboard/effectifs-par-cfa", requestBody);

  if (loading) {
    return <CfasRowsLoading />;
  }

  if (!data) return null;

  return (
    <>
      {data.map(({ uai_etablissement, nom_etablissement, effectifs }) => {
        return (
          <CfaRow
            uai_etablissement={uai_etablissement}
            nom_etablissement={nom_etablissement}
            effectifs={effectifs}
            key={uai_etablissement}
          />
        );
      })}
    </>
  );
};

CfasRows.propTypes = {
  departementCode: PropTypes.string.isRequired,
};

export default CfasRows;
