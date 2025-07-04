"use client";

import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { IMissionLocaleWithStats } from "shared";

import UNMLAdminContent from "@/app/_components/admin/mission-locale/UNMLAdminContent";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";
import { ARMLFiltersQuery, parseARMLFiltersFromQuery } from "@/modules/admin/arml/model/arml-filters";

export default function MissionLocaleAdminClient() {
  const searchParams = useSearchParams();

  const mlFilters = useMemo(() => {
    if (!searchParams) return {};
    const query = Object.fromEntries(searchParams.entries());
    return parseARMLFiltersFromQuery(query as unknown as ARMLFiltersQuery);
  }, [searchParams]);

  const { data: unmlAdminData } = useQuery<Array<IMissionLocaleWithStats>>(
    ["unml", mlFilters],
    async () => {
      const data = await _get("/api/v1/admin/mission-locale/stats", { params: mlFilters });
      return data;
    },
    {
      suspense: true,
    }
  );

  if (!unmlAdminData) return null;

  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <Breadcrumb
            currentPageLabel="Gestion des missions locales"
            segments={[
              {
                label: "Accueil",
                linkProps: {
                  href: "/",
                },
              },
            ]}
          />
        </div>
        <div className="fr-col-12">
          <h3 className="fr-h3" style={{ marginBottom: "1rem", color: "var(--text-title-blue-france)" }}>
            Vue nationale des Missions Locales
          </h3>
        </div>
        <div className="fr-col-12">
          <UNMLAdminContent unmlData={unmlAdminData} />
        </div>
      </div>
    </SuspenseWrapper>
  );
}
