import React from "react";

import { fetchRepartitionByFormationCsvExport } from "../../../common/api/tableauDeBord";
import { useFiltersContext } from "../../../pages/tableau-de-bord/FiltersContext";
import DownloadButton from "../../components/DownloadButton/DownloadButton";
import { mapFiltersToApiFormat } from "../../utils/mapFiltersToApiFormat";

const ExportRepartitionByFormationButton = () => {
  const { state: filters } = useFiltersContext();
  const fileName = `export-repartition-effectifs-par-formation-${filters.date.toISOString()}.csv`;

  return (
    <DownloadButton
      getFile={() => {
        return fetchRepartitionByFormationCsvExport(mapFiltersToApiFormat(filters));
      }}
      fileName={fileName}
    >
      Exporter la liste des formations
    </DownloadButton>
  );
};

export default ExportRepartitionByFormationButton;
