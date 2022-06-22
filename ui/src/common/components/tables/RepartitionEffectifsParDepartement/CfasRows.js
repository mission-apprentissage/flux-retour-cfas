import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";
import { useHistory } from "react-router-dom";

import { useFiltersContext } from "../../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import { fetchEffectifsParCfa } from "../../../api/tableauDeBord";
import { QUERY_KEYS } from "../../../constants/queryKeys";
import { navigateToOrganismePage } from "../../../utils/routing";
import { sortAlphabeticallyBy } from "../../../utils/sortAlphabetically";
import RowsSkeleton from "../../skeletons/RowsSkeleton";
import CfaRow from "./CfaRow";

const CfasRows = ({ departementCode }) => {
  const filtersContext = useFiltersContext();
  const history = useHistory();
  const requestFilters = {
    date: filtersContext.state.date.toISOString(),
    etablissement_num_departement: departementCode,
  };
  const { data, isLoading } = useQuery([QUERY_KEYS.EFFECTIF_PAR.CFA, requestFilters], () =>
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
            onCfaClick={() => {
              navigateToOrganismePage(history, { uai_etablissement, nom_etablissement });
              window.scrollTo(0, 0);
            }}
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
