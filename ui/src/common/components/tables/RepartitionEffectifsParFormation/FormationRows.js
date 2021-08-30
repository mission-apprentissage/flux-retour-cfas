import PropTypes from "prop-types";
import qs from "query-string";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { useFetch } from "../../../hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../utils/mapFiltersToApiFormat";
import { pick } from "../../../utils/pick";
import RowsSkeleton from "../../skeletons/RowsSkeleton";
import FormationRow from "./FormationRow";

const FormationRows = ({ niveauFormation }) => {
  const { state: filters } = useFiltersContext();
  const queryParams = qs.stringify({
    niveau_formation: niveauFormation,
    ...pick(mapFiltersToApiFormat(filters), [
      "date",
      "uai_etablissement",
      "siret_etablissement",
      "etablissement_reseaux",
      "etablissement_num_region",
      "etablissement_num_departement",
    ]),
  });
  const [data, loading] = useFetch(`/api/dashboard/effectifs-par-formation?${queryParams}`);

  if (loading) {
    return <RowsSkeleton nbRows={3} nbColumns={5} />;
  }

  if (!data) return null;

  return (
    <>
      {data.map(({ formation_cfd, intitule, effectifs }) => {
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
