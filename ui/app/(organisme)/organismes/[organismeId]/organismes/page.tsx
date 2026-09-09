import { Suspense } from "react";

import { OrganismeNavTabs } from "@/app/_components/dashboard/OrganismeNavTabs";
import OrganismesListClient from "@/app/_components/organismes/OrganismesListClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";

export async function generateMetadata({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;
  return PAGES.dynamic.organismeOrganismes({ organismeId }).getMetadata();
}

export default async function OrganismeOrganismesPage({ params }: { params: Promise<{ organismeId: string }> }) {
  const { organismeId } = await params;

  return (
    <OrganismeNavTabs organismeId={organismeId} activeTab="organismes">
      <Suspense fallback={<TableSkeleton />}>
        <OrganismesListClient modePublique organismeId={organismeId} />
      </Suspense>
    </OrganismeNavTabs>
  );
}
