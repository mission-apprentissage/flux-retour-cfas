import PropTypes from "prop-types";
import qs from "query-string";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { useFetch } from "../../../hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../utils/mapFiltersToApiFormat";
import { pick } from "../../../utils/pick";
import AnneeFormationRow from "./AnneeFormationRow";

const AnneeFormationRows = ({ formationCfd }) => {
  const { state: filters } = useFiltersContext();
  const queryParams = qs.stringify({
    formation_cfd: formationCfd,
    ...pick(mapFiltersToApiFormat(filters), [
      "date",
      "uai_etablissement",
      "siret_etablissement",
      "etablissement_num_region",
      "etablissement_num_departement",
      "etablissement_reseaux",
    ]),
  });
  const [data] = useFetch(`/api/dashboard/effectifs-par-annee-formation?${queryParams}`);

  if (!data) return null;

  return (
    <>
      {data
        .slice()
        .sort((a, b) => (a.annee_formation < b.annee_formation ? 1 : -1))
        .map(({ annee_formation, effectifs }) => {
          return <AnneeFormationRow key={annee_formation} anneeFormation={annee_formation} effectifs={effectifs} />;
        })}
    </>
  );
};

AnneeFormationRows.propTypes = {
  formationCfd: PropTypes.string.isRequired,
};

export default AnneeFormationRows;
