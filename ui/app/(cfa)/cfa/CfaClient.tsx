"use client";

import { CfaDashboard } from "@/app/_components/ruptures/cfa/CfaDashboard";
import { CfaDashboardSkeleton } from "@/app/_components/ruptures/cfa/CfaDashboardSkeleton";
import { useCfaEffectifsRuptures } from "@/app/_components/ruptures/cfa/hooks";
import { useAuth } from "@/app/_context/UserContext";

export default function CfaClient() {
  const { user } = useAuth();
  const organismeId = user?.organisation?.organisme_id;

  const { data, isLoading } = useCfaEffectifsRuptures(organismeId);

  if (!organismeId || !data || isLoading) {
    return <CfaDashboardSkeleton />;
  }

  return (
    <div className="fr-container">
      <CfaDashboard data={data} />
    </div>
  );
}
