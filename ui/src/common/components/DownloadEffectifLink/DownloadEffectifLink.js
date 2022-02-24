import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../pages/tableau-de-bord/FiltersContext";
import { fetchEffectifsDataListXlsxExport } from "../../api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../utils/mapFiltersToApiFormat";
import DownloadLink from "../DownloadLink/DownloadLink";

const DownloadEffectifLink = ({ count, effectifIndicateur }) => {
  const { state: filters } = useFiltersContext();
  const fileName = `tdb-${count}_${effectifIndicateur}_${new Date().toLocaleDateString()}.xlsx`;

  return (
    <DownloadLink
      getFile={() => {
        return fetchEffectifsDataListXlsxExport(mapFiltersToApiFormat(filters), effectifIndicateur);
      }}
      fileName={fileName}
    >
      Télécharger la liste
    </DownloadLink>
  );
};
DownloadEffectifLink.propTypes = {
  count: PropTypes.number.isRequired,
  effectifIndicateur: PropTypes.string.isRequired,
};

export default DownloadEffectifLink;
