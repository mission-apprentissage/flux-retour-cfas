import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { usePostFetch } from "../../../hooks/useFetch";
import { omitNullishValues } from "../../../utils/omitNullishValues";
import RowsSkeleton from "../../skeletons/RowsSkeleton";
import CfaRow from "./CfaRow";

const CfasRows = ({ departementCode }) => {
  const { state: filters } = useFiltersContext();
  const requestBody = omitNullishValues({
    date: filters.date.toISOString(),
    etablissement_num_departement: departementCode,
  });
  const [data, loading] = usePostFetch("/api/dashboard/effectifs-par-cfa", requestBody);

  if (loading) {
    return <RowsSkeleton nbRows={3} nbColumns={5} />;
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
