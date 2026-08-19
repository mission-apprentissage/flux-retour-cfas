import { Suspense } from "react";

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
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <Suspense fallback={<TableSkeleton />}>
        <OrganismesListClient modePublique organismeId={organismeId} />
      </Suspense>
    </div>
  );
}
