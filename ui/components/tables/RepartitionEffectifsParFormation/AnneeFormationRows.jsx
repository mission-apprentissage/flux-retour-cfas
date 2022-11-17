import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";

import { fetchEffectifsParAnneeFormation } from "../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../common/constants/queryKeys";
import { mapFiltersToApiFormat } from "../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../common/utils/pick";
import { sortAlphabeticallyBy } from "../../../common/utils/sortAlphabetically";
import { useFiltersContext } from "../../../components/_pagesComponents/FiltersContext.js";
import AnneeFormationRow from "./AnneeFormationRow";

const AnneeFormationRows = ({ formationCfd }) => {
  const { state: filters } = useFiltersContext();
  const requestFilters = {
    formation_cfd: formationCfd,
    ...pick(mapFiltersToApiFormat(filters), [
      "date",
      "uai_etablissement",
      "siret_etablissement",
      "etablissement_num_region",
      "etablissement_num_departement",
      "etablissement_reseaux",
    ]),
  };
  const { data } = useQuery([QUERY_KEYS.EFFECTIF_PAR.ANNEE_FORMATION, requestFilters], () =>
    fetchEffectifsParAnneeFormation(requestFilters)
  );
  if (!data) return null;

  return (
    <>
      {sortAlphabeticallyBy("annee_formation", data).map(({ annee_formation, effectifs }) => {
        return <AnneeFormationRow key={annee_formation} anneeFormation={annee_formation} effectifs={effectifs} />;
      })}
    </>
  );
};

AnneeFormationRows.propTypes = {
  formationCfd: PropTypes.string.isRequired,
};

export default AnneeFormationRows;
