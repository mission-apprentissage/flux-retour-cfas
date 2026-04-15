"use client";

import { Skeleton } from "@mui/material";

import { MlCollaborationDetail, useMlEffectifDetail } from "@/app/_components/ruptures/mission-locale/collaboration";

export default function MissionLocaleDetailClient({ id }: { id: string }) {
  const { data, isLoading } = useMlEffectifDetail(id);

  if (isLoading || !data) {
    return (
      <div className="fr-container fr-py-4w">
        <Skeleton variant="rectangular" height={60} className="fr-mb-2w" />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  return <MlCollaborationDetail data={data} />;
}
