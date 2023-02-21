import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "@tanstack/react-query";

import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { fetchEffectifsParAnneeFormation } from "@/common/api/tableauDeBord";
import { QUERY_KEYS } from "@/common/constants/queryKeys";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import { pick } from "@/common/utils/pick";
import { sortAlphabeticallyBy } from "@/common/utils/sortAlphabetically";
import AnneeFormationRow from "./AnneeFormationRow";

const AnneeFormationRows = ({ formationCfd, niveauFormation }) => {
  const { state: filters } = useFiltersContext();
  const requestFilters = {
    formation_cfd: formationCfd,
    ...(niveauFormation ? { niveau_formation: niveauFormation } : {}),
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
  niveauFormation: PropTypes.string,
};

export default AnneeFormationRows;
