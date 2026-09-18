import { Suspense } from "react";

import { MissionLocaleDetailView } from "@/app/_components/statistiques/views/MissionLocaleDetailView";

export default async function MissionLocaleDetailPage({ params }: { params: Promise<{ mlId: string }> }) {
  const { mlId } = await params;
  return (
    <Suspense>
      <MissionLocaleDetailView mlId={mlId} isAdmin />
    </Suspense>
  );
}
