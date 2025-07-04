"use client";

import { useState } from "react";

import {
  GlobalSearchBar,
  TableauMissionLocale,
  RepartitionDataViews,
  type MissionLocale,
} from "@/app/_components/arml/ARMLMissionsLocalesComponents";

interface UNMLAdminMissionsLocalesContentProps {
  unmlData: Array<MissionLocale>;
}

export default function UNMLAdminMissionsLocalesContent({ unmlData }: UNMLAdminMissionsLocalesContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeVue, setTypeVue] = useState<string | null>("graph");

  const customNavigationPath = (id: string) => `/admin/mission-locale/${id}`;
  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <GlobalSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>
      <TableauMissionLocale data={unmlData} searchTerm={searchTerm} customNavigationPath={customNavigationPath} />
      <RepartitionDataViews
        typeVue={typeVue}
        data={unmlData}
        searchTerm={searchTerm}
        onTypeVueChange={setTypeVue}
        customNavigationPath={customNavigationPath}
      />
    </>
  );
}
