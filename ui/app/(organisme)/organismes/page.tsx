import { Suspense } from "react";

import OrganismesListClient from "@/app/_components/organismes/OrganismesListClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";

export const metadata = PAGES.static.organismes.getMetadata();

export default function OrganismesPage() {
  return (
    <div className="fr-container fr-pt-3w fr-pb-6w">
      <Suspense fallback={<TableSkeleton />}>
        <OrganismesListClient />
      </Suspense>
    </div>
  );
}
