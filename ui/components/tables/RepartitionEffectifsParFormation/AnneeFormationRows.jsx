import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "@tanstack/react-query";

import { useFiltersContext } from "../../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import { fetchEffectifsParAnneeFormation } from "../../../api/tableauDeBord";
import { QUERY_KEYS } from "../../../constants/queryKeys";
import { mapFiltersToApiFormat } from "../../../utils/mapFiltersToApiFormat";
import { pick } from "../../../utils/pick";
import { sortAlphabeticallyBy } from "../../../utils/sortAlphabetically";
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
