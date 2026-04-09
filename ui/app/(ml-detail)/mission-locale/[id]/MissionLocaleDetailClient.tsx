"use client";

import { MlCollaborationDetail, useMlEffectifDetail } from "@/app/_components/ruptures/mission-locale/collaboration";

export default function MissionLocaleDetailClient({ id }: { id: string }) {
  const { data } = useMlEffectifDetail(id);

  if (!data) return null;

  return <MlCollaborationDetail data={data} />;
}
