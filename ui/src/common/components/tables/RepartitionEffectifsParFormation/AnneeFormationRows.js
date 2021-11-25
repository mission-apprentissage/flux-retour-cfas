import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { fetchEffectifsParAnneeFormation } from "../../../api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../utils/mapFiltersToApiFormat";
import { pick } from "../../../utils/pick";
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
  const { data } = useQuery(["effectifs-par-niveau-formation", requestFilters], () =>
    fetchEffectifsParAnneeFormation(requestFilters)
  );
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
