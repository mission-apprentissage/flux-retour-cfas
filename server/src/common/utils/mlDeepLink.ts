import config from "@/config";

type MlDeepLinkParams = { filter?: string; statut?: string };

/**
 * Construit une URL absolue vers la liste des effectifs ML, paramétrée par filtre
 * ou statut.
 */
export function buildMlDeepLink(params: MlDeepLinkParams): string {
  const search = new URLSearchParams();
  if (params.filter) search.set("filter", params.filter);
  if (params.statut) search.set("statut", params.statut);
  const qs = search.toString();
  return `${config.publicUrl}/mission-locale${qs ? `?${qs}` : ""}`;
}
