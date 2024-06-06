import { ORGANISATION_TYPE } from "shared";

import { effectifsExportColumns, effectifsExportWithContactColumns } from "../exports";

export const getEffectifsExportColumnFromOrganisationType = (organisationType) => {
  switch (organisationType) {
    case ORGANISATION_TYPE.DREETS:
    case ORGANISATION_TYPE.DDETS:
    case ORGANISATION_TYPE.ACADEMIE:
      return [...effectifsExportColumns, ...effectifsExportWithContactColumns];
    default:
      return effectifsExportColumns;
  }
};
