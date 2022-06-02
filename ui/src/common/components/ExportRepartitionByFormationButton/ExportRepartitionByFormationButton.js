import React from "react";

import { fetchRepartitionByFormationCsvExport } from "../../../common/api/tableauDeBord";
import { useFiltersContext } from "../../../pages/app/visualiser-les-indicateurs/FiltersContext";
import DownloadButton from "../../components/DownloadButton/DownloadButton";
import { buildFileName } from "../../utils/buildFileNameFromFilters";
import { mapFiltersToApiFormat } from "../../utils/mapFiltersToApiFormat";

const ExportRepartitionByFormationButton = () => {
  const { state: filters } = useFiltersContext();
  const fileName = buildFileName("liste_formations", filters);

  return (
    <DownloadButton
      getFile={() => {
        return fetchRepartitionByFormationCsvExport(mapFiltersToApiFormat(filters));
      }}
      fileName={fileName}
    >
      Exporter la liste des formations (fichier csv)
    </DownloadButton>
  );
};

export default ExportRepartitionByFormationButton;
