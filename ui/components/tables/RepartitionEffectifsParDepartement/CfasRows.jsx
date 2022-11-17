import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";

import { fetchEffectifsParCfa } from "../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../common/constants/queryKeys";
import { mapFiltersToApiFormat } from "../../../common/utils/mapFiltersToApiFormat";
import { navigateToOrganismePage } from "../../../common/utils/routing";
import { sortAlphabeticallyBy } from "../../../common/utils/sortAlphabetically";
import { useFiltersContext } from "../../../components/_pagesComponents/FiltersContext.js";
import RowsSkeleton from "../../skeletons/RowsSkeleton";
import CfaRow from "./CfaRow";

const CfasRows = ({ departementCode }) => {
  const filtersContext = useFiltersContext();
  const history = useNavigate();
  const requestFilters = {
    ...mapFiltersToApiFormat(filtersContext.state),
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
      {sortAlphabeticallyBy("nom_etablissement", data).map(
        ({ uai_etablissement, siret_etablissement, nom_etablissement, nature, natureValidityWarning, effectifs }) => {
          return (
            <CfaRow
              uai_etablissement={uai_etablissement}
              nom_etablissement={nom_etablissement}
              siret_etablissement={siret_etablissement}
              nature={nature}
              natureValidityWarning={natureValidityWarning}
              effectifs={effectifs}
              key={uai_etablissement}
              onCfaClick={() => {
                navigateToOrganismePage(history, { uai_etablissement, nom_etablissement });
                window.scrollTo(0, 0);
              }}
            />
          );
        }
      )}
    </>
  );
};

CfasRows.propTypes = {
  departementCode: PropTypes.string.isRequired,
};

export default CfasRows;
