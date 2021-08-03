import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { useFetch } from "../../../hooks/useFetch";
import { omitNullishValues } from "../../../utils/omitNullishValues";
import RowsSkeleton from "../../skeletons/RowsSkeleton";
import FormationRow from "./FormationRow";

const buildSearchParams = (filters, niveauFormation) => {
  const date = filters.date.toISOString();

  return queryString.stringify(
    omitNullishValues({
      niveau_formation: niveauFormation,
      date,
      uai_etablissement: filters.cfa?.uai_etablissement ?? null,
      siret_etablissement: filters.sousEtablissement?.siret_etablissement,
      etablissement_reseaux: filters.reseau?.nom ?? null,
      etablissement_num_region: filters.region?.code ?? null,
      etablissement_num_departement: filters.departement?.code ?? null,
    })
  );
};

const FormationRows = ({ niveauFormation }) => {
  const { state: filters } = useFiltersContext();
  const searchParamsString = buildSearchParams(filters, niveauFormation);
  const [data, loading] = useFetch(`/api/dashboard/effectifs-par-formation?${searchParamsString}`);

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
