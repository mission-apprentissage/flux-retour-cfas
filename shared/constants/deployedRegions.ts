export const DEPLOYED_REGIONS = {
  HAUTS_DE_FRANCE: "32",
  ILE_DE_FRANCE: "11",
  PACA: "93",
  NOUVELLE_AQUITAINE: "75",
  LA_REUNION: "04",
} as const;

export const DEPLOYED_REGION_CODES = Object.values(DEPLOYED_REGIONS);

export function isRegionDeployed(regionCode: string): boolean {
  return DEPLOYED_REGION_CODES.includes(regionCode as any);
}
