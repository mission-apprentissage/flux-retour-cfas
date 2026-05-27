import type { ContactListUtm } from "./types";

/**
 * Ajoute des paramètres UTM (source/medium/campaign/content) à une URL.
 * Préserve les query params existants. Retourne l'URL inchangée si `utm` est absent.
 */
export const buildUtmUrl = (baseUrl: string, utm?: ContactListUtm): string => {
  if (!utm) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", utm.source);
  url.searchParams.set("utm_medium", utm.medium);
  if (utm.campaign) url.searchParams.set("utm_campaign", utm.campaign);
  if (utm.content) url.searchParams.set("utm_content", utm.content);
  return url.toString();
};
