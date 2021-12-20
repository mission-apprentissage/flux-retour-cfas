import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { fetchEffectifsParCfa } from "../../../api/tableauDeBord";
import { sortAlphabeticallyBy } from "../../../utils/sortAlphabetically";
import RowsSkeleton from "../../skeletons/RowsSkeleton";
import CfaRow from "./CfaRow";

const CfasRows = ({ departementCode }) => {
  const filters = useFiltersContext();
  const requestFilters = {
    date: filters.state.date.toISOString(),
    etablissement_num_departement: departementCode,
  };
  const { data, isLoading } = useQuery(["effectifs-par-cfa", requestFilters], () =>
    fetchEffectifsParCfa(requestFilters)
  );

  if (isLoading) {
    return <RowsSkeleton nbRows={3} nbColumns={5} />;
  }

  if (!data) return null;

  return (
    <>
      {sortAlphabeticallyBy("nom_etablissement", data).map(({ uai_etablissement, nom_etablissement, effectifs }) => {
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
