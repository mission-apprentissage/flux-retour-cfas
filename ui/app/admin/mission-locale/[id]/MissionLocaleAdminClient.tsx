"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use } from "react";

import MissionLocaleDetailsContent from "@/app/_components/arml/MissionLocaleDetailsContent";
import CustomBreadcrumb from "@/app/_components/Breadcrumb";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function MissionLocaleDetailsClient({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: missionLocaleData } = useQuery(
    ["mission-locale", id],
    () => _get(`/api/v1/admin/mission-locale/${id}/stats`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  if (!missionLocaleData) return null;
  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-6 fr-col-6" style={{ marginBottom: "2rem" }}>
          <CustomBreadcrumb path={`/admin/mission-locale/[mlId]`} name={missionLocaleData.nom} />
        </div>
        <div className="fr-col-md-6 fr-col-6" style={{ textAlign: "right", marginBottom: "2rem", paddingTop: "2rem" }}>
          <Button
            iconId="ri-arrow-right-line"
            iconPosition="right"
            onClick={() => router.push(`/admin/mission-locale/${id}/edit`)}
          >
            Édition de fiches
          </Button>
        </div>
      </div>

      <MissionLocaleDetailsContent ml={missionLocaleData} />
    </SuspenseWrapper>
  );
}
