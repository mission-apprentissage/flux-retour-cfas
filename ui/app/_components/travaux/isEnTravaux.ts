import { ORGANISATION_TYPE } from "shared";

const ORGANISATION_TYPES_EN_TRAVAUX: string[] = [ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DDETS];

// Les anciennes URL restent valides : les DREETS/DDETS y voient la page travaux, les autres profils leur écran habituel.
export function isEnTravaux(organisationType: string | undefined | null) {
  return ORGANISATION_TYPES_EN_TRAVAUX.includes(organisationType ?? "");
}
