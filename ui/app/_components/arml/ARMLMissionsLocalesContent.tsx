"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  GlobalSearchBar,
  TableauMissionLocale,
  RepartitionDataViews,
  ExportButton,
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
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportError = (error: string) => {
    setExportError(error);
  };

  const handleExportSuccess = () => {
    setExportError(null);
  };

  const customNavigationPath = (id: string) => `/arml/missions-locales/${id}`;
  return (
    <>
      <CustomBreadcrumb path={pathname} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2
          className="fr-h2"
          style={{ marginTop: "0.5rem", marginBottom: "0", color: "var(--text-title-blue-france)" }}
        >
          Informations détaillées par Mission Locale
        </h2>
        <ExportButton onError={handleExportError} onSuccess={handleExportSuccess} />
      </div>
      {exportError && (
        <Alert
          severity="error"
          title="Erreur lors de l'export"
          description={exportError}
          closable
          onClose={() => setExportError(null)}
          style={{ marginBottom: "2rem" }}
        />
      )}
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
