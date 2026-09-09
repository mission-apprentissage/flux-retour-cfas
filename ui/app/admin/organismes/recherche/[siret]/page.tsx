import { Suspense } from "react";

import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";

import OrganismeSupportClient from "./OrganismeSupportClient";

export async function generateMetadata({ params }: { params: Promise<{ siret: string }> }) {
  const { siret } = await params;
  return PAGES.dynamic.adminOrganismeSupport({ siret }).getMetadata();
}

export default async function Page({ params }: { params: Promise<{ siret: string }> }) {
  const { siret } = await params;

  return (
    <Suspense fallback={<TableSkeleton />}>
      <OrganismeSupportClient siret={siret} />
    </Suspense>
  );
}
