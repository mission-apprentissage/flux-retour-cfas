import PropTypes from "prop-types";
import queryString from "query-string";
import React, { useEffect, useState } from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { _get } from "../../../httpClient";
import { omitNullishValues } from "../../../utils/omitNullishValues";
import AnneeFormationRow from "./AnneeFormationRow";

const AnneeFormationRows = ({ formationCfd }) => {
  const [data, setData] = useState();
  const buildSearchParams = (filters) => {
    const date = filters.date.toISOString();

    return queryString.stringify(
      omitNullishValues({
        date,
        formation_cfd: formationCfd,
        uai_etablissement: filters.cfa?.uai_etablissement ?? null,
        etablissement_reseaux: filters.reseau?.nom ?? null,
        etablissement_num_region: filters.region?.code ?? null,
        etablissement_num_departement: filters.departement?.code ?? null,
      })
    );
  };
  const { state: filters } = useFiltersContext();
  const searchParamsString = buildSearchParams(filters);

  useEffect(() => {
    const fetchData = async () => {
      const data = await _get(`/api/dashboard/effectifs-par-annee-formation?${searchParamsString}`);
      setData(data);
    };

    fetchData();
  }, [searchParamsString]);

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
