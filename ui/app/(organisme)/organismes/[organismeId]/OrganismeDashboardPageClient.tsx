"use client";

import { DashboardOrganismeClient } from "@/app/_components/dashboard/DashboardOrganismeClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useOrganisme } from "@/hooks/organismes";

export default function OrganismeDashboardPageClient({ organismeId }: { organismeId: string }) {
  const { organisme } = useOrganisme(organismeId);

  if (!organisme) {
    return (
      <div className="fr-container fr-pt-3w fr-pb-6w">
        <TableSkeleton />
      </div>
    );
  }

  return <DashboardOrganismeClient organisme={organisme} modePublique />;
}
