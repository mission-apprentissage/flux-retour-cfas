import type { IOrganisationJson } from "shared";

export function isCfaWithMlBeta(organisation?: IOrganisationJson | null): boolean {
  return organisation?.type === "ORGANISME_FORMATION" && !!organisation.ml_beta_activated_at;
}
