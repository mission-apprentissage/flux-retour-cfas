import { getLbaTrainingLinks, LBA_URL } from "@/common/apis/lba/lba.api";

export const getLbaTrainingLinksWithCustomUtm = async (
  cfd: string,
  rncp: string,
  utms: { source: string; medium: string; campaign: string }
) => {
  const lbaResponse = await getLbaTrainingLinks(cfd, rncp);
  let lbaUrl: string = `${LBA_URL}/recherche-emploi`;

  if (lbaResponse && lbaResponse.data && lbaResponse.data.length) {
    lbaUrl = lbaResponse.data[0].lien_lba as string;
  }

  const url = new URL(lbaUrl);
  url.searchParams.set("utm_source", utms.source);
  url.searchParams.set("utm_medium", utms.medium);
  url.searchParams.set("utm_campaign", utms.campaign);
  lbaUrl = url.toString();

  return lbaUrl;
};
