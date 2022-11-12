import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";

import { useFiltersContext } from "../../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import { fetchEffectifsParFormation } from "../../../api/tableauDeBord";
import { QUERY_KEYS } from "../../../constants/queryKeys";
import { mapFiltersToApiFormat } from "../../../utils/mapFiltersToApiFormat";
import { pick } from "../../../utils/pick";
import { sortAlphabeticallyBy } from "../../../utils/sortAlphabetically";
import RowsSkeleton from "../../skeletons/RowsSkeleton";
import FormationRow from "./FormationRow";

const FormationRows = ({ niveauFormation }) => {
  const { state: filters } = useFiltersContext();
  const requestFilters = {
    niveau_formation: niveauFormation,
    ...pick(mapFiltersToApiFormat(filters), [
      "date",
      "uai_etablissement",
      "siret_etablissement",
      "etablissement_reseaux",
      "etablissement_num_region",
      "etablissement_num_departement",
    ]),
  };
  const { data, isLoading } = useQuery([QUERY_KEYS.EFFECTIF_PAR.FORMATION, requestFilters], () =>
    fetchEffectifsParFormation(requestFilters)
  );

  if (isLoading) {
    return <RowsSkeleton nbRows={3} nbColumns={5} />;
  }

  if (!data) return null;

  return (
    <>
      {sortAlphabeticallyBy("intitule", data).map(({ formation_cfd, intitule, effectifs }) => {
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
