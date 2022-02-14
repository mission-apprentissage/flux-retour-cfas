import React from "react";

import { fetchRepartitionByOrganismeCsvExport } from "../../../common/api/tableauDeBord";
import { useFiltersContext } from "../../../pages/tableau-de-bord/FiltersContext";
import DownloadButton from "../../components/DownloadButton/DownloadButton";
import { buildFileName } from "../../utils/buildFileNameFromFilters";
import { mapFiltersToApiFormat } from "../../utils/mapFiltersToApiFormat";

const ExportRepartitionByOrganismeButton = () => {
  const { state: filters } = useFiltersContext();
  const fileName = buildFileName("liste_organismes", filters);

  return (
    <DownloadButton
      getFile={() => {
        return fetchRepartitionByOrganismeCsvExport(mapFiltersToApiFormat(filters));
      }}
      fileName={fileName}
    >
      Exporter la liste des organismes
    </DownloadButton>
  );
};

export default ExportRepartitionByOrganismeButton;
