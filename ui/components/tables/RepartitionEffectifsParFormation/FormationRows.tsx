import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import React from "react";

import { fetchEffectifsParFormation } from "@/common/api/tableauDeBord";
import { QUERY_KEYS } from "@/common/constants/queryKeys";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import { pick } from "@/common/utils/pick";
import { sortAlphabeticallyBy } from "@/common/utils/sortAlphabetically";
import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";

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
  const { data, isLoading } = useQuery<any, any>([QUERY_KEYS.EFFECTIF_PAR.FORMATION, requestFilters], () =>
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
          <FormationRow
            formationCfd={formation_cfd}
            intitule={intitule}
            effectifs={effectifs}
            niveauFormation={niveauFormation}
            key={formation_cfd}
          />
        );
      })}
    </>
  );
};

FormationRows.propTypes = {
  niveauFormation: PropTypes.string.isRequired,
};

export default FormationRows;
