"use client";

import { Suspense } from "react";

import { useUserRegions } from "@/app/_components/statistiques/hooks/useUserRegions";
import { RegionView } from "@/app/_components/statistiques/views/RegionView";

export default function RegionMLPage() {
  const { regions, isLoading } = useUserRegions();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const defaultRegionCode = regions[0];

  if (!defaultRegionCode) {
    return <div>Aucune région disponible</div>;
  }

  return (
    <Suspense>
      <RegionView regionCode={defaultRegionCode} isAdmin={false} />
    </Suspense>
  );
}
