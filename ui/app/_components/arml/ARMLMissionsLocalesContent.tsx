"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  GlobalSearchBar,
  TableauMissionLocale,
  RepartitionDataViews,
  type MissionLocale,
} from "@/app/_components/arml/ARMLMissionsLocalesComponents";
import CustomBreadcrumb from "@/app/_components/Breadcrumb";

interface ARMLMissionsLocalesContentProps {
  armlData: { mlList: MissionLocale[] };
}

export default function ARMLMissionsLocalesContent({ armlData }: ARMLMissionsLocalesContentProps) {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeVue, setTypeVue] = useState<string | null>("graph");

  const customNavigationPath = (id: string) => `/arml/missions-locales/${id}`;
  return (
    <>
      <CustomBreadcrumb path={pathname} />
      <h2
        className="fr-h2"
        style={{ marginTop: "0.5rem", marginBottom: "2rem", color: "var(--text-title-blue-france)" }}
      >
        Répartitions des données
      </h2>
      <div style={{ marginBottom: "2rem" }}>
        <GlobalSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>
      <TableauMissionLocale
        data={armlData.mlList}
        searchTerm={searchTerm}
        customNavigationPath={customNavigationPath}
      />
      <RepartitionDataViews
        typeVue={typeVue}
        data={armlData.mlList}
        searchTerm={searchTerm}
        onTypeVueChange={setTypeVue}
        customNavigationPath={customNavigationPath}
      />
    </>
  );
}
