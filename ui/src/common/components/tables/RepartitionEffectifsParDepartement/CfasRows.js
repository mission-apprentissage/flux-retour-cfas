import PropTypes from "prop-types";
import qs from "query-string";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { useFetch } from "../../../hooks/useFetch";
import RowsSkeleton from "../../skeletons/RowsSkeleton";
import CfaRow from "./CfaRow";

const CfasRows = ({ departementCode }) => {
  const filters = useFiltersContext();
  const queryParams = qs.stringify({
    date: filters.state.date.toISOString(),
    etablissement_num_departement: departementCode,
  });
  const [data, loading] = useFetch(`/api/dashboard/effectifs-par-cfa?${queryParams}`);

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
            onCfaClick={filters.setters.setCfa}
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
