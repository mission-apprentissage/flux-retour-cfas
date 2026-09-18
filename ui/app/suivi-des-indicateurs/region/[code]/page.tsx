import { Suspense } from "react";

import { RegionView } from "@/app/_components/statistiques/views/RegionView";

interface RegionDetailPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function RegionDetailMLPage({ params }: RegionDetailPageProps) {
  const { code } = await params;
  return (
    <Suspense>
      <RegionView regionCode={code} isAdmin={false} />
    </Suspense>
  );
}
