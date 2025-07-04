"use client";
import { useQuery } from "@tanstack/react-query";

import { type MissionLocale } from "@/app/_components/arml/ARMLMissionsLocalesComponents";
import ARMLMissionsLocalesContent from "@/app/_components/arml/ARMLMissionsLocalesContent";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function ARMLMissionsLocalesClient() {
  const { data: armlData } = useQuery<{ mlList: MissionLocale[] }>(
    ["arml"],
    async () => {
      const data = await _get("/api/v1/organisation/arml/mls");
      return data;
    },
    { suspense: true }
  );

  if (!armlData) return null;

  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <ARMLMissionsLocalesContent armlData={armlData} />
    </SuspenseWrapper>
  );
}
