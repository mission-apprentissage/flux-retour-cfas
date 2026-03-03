"use client";

import { useQuery } from "@tanstack/react-query";

import { CfaDashboard } from "@/app/_components/ruptures/cfa/CfaDashboard";
import { CfaDashboardSkeleton } from "@/app/_components/ruptures/cfa/CfaDashboardSkeleton";
import { useAuth } from "@/app/_context/UserContext";
import { _get } from "@/common/httpClient";
import type { ICfaRupturesResponse } from "@/common/types/cfaRuptures";

export default function CfaClient() {
  const { user } = useAuth();
  const organismeId = user?.organisation?.organisme_id;

  const { data, isLoading } = useQuery<ICfaRupturesResponse>(
    ["cfa-effectifs-ruptures", organismeId],
    () => _get(`/api/v1/organismes/${organismeId}/cfa/effectifs-ruptures`),
    {
      enabled: !!organismeId,
      useErrorBoundary: true,
    }
  );

  if (!data || isLoading) {
    return <CfaDashboardSkeleton />;
  }

  return (
    <div className="fr-container">
      <CfaDashboard data={data} />
    </div>
  );
}
