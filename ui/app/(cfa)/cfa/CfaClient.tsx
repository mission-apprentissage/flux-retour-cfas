"use client";

import { useQuery } from "@tanstack/react-query";

import { CfaDisplay } from "@/app/_components/cfa/CfaDisplay";
import CfaHeader from "@/app/_components/cfa/CfaHeader";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { useAuth } from "@/app/_context/UserContext";
import { _get } from "@/common/httpClient";

import { MonthsData } from "../../../common/types/ruptures";

export default function CfaClient() {
  const { user } = useAuth();
  const { data } = useQuery<MonthsData>(
    ["effectifs-per-month-user-cfa", user?.organisation?.organisme_id],
    () => _get(`/api/v1/organismes/${user?.organisation?.organisme_id}/mission-locale/effectifs-per-month`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  return (
    <div className="fr-container">
      <CfaHeader />
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>{data && <CfaDisplay data={data} />}</SuspenseWrapper>
    </div>
  );
}
