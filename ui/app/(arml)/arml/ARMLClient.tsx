"use client";

import { useQuery } from "@tanstack/react-query";
import { IOrganisationARML, IMissionLocaleWithStats } from "shared";

import ARMLContent from "@/app/_components/arml/ARMLContent";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function ARMLClient() {
  const { data: armlData } = useQuery<{ arml: IOrganisationARML; mlList: Array<IMissionLocaleWithStats> }>(
    ["arml"],
    async () => {
      const data = await _get("/api/v1/organisation/arml/mls");
      return data;
    },
    {
      suspense: true,
    }
  );

  if (!armlData) return null;

  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <ARMLContent armlData={armlData} />
    </SuspenseWrapper>
  );
}
