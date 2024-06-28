import { ORGANISATION_TYPE } from "../constants";

export const shouldDisplayContactInEffectifNominatif = (organisationType: string) => {
  switch (organisationType) {
    case ORGANISATION_TYPE.DREETS:
    case ORGANISATION_TYPE.DDETS:
    case ORGANISATION_TYPE.ACADEMIE:
      return true;
    default:
      return false;
  }
};
