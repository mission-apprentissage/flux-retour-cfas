import { REGIONS_WITH_SVG_SORTED } from "shared/constants/territoires";

import { RegionView } from "@/app/_components/statistiques/views/RegionView";

export function generateStaticParams() {
  return REGIONS_WITH_SVG_SORTED.map((region) => ({
    code: region.code,
  }));
}

export default async function RegionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RegionView regionCode={code} />;
}
