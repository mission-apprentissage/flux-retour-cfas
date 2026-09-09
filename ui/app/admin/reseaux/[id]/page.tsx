import { Suspense } from "react";

import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";

import ReseauOrganismesClient from "./ReseauOrganismesClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return PAGES.dynamic.adminReseau({ id }).getMetadata();
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<TableSkeleton />}>
      <ReseauOrganismesClient id={id} />
    </Suspense>
  );
}
