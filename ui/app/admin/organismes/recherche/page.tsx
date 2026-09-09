import { Suspense } from "react";

import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";

import RechercheOrganismesClient from "./RechercheOrganismesClient";

export const metadata = PAGES.static.adminOrganismesRecherche.getMetadata();

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <RechercheOrganismesClient />
    </Suspense>
  );
}
