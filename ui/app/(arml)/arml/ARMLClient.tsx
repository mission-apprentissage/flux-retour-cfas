"use client";

import { useQuery } from "@tanstack/react-query";
import { IOrganisationARML, IMissionLocaleWithStats } from "shared";

import ARMLIndicateurGlobal from "@/app/_components/arml/ARMLIndicateurGlobal";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

function ARMLContent() {
  const { data: armlData } = useQuery<{ arml: IOrganisationARML; mlList: Array<IMissionLocaleWithStats> }>(
    ["arml"],
    async () => {
      const data = await _get("/api/v1/organisation/arml/mls");
      return data;
    },
    {
      suspense: true,
    }
  );

  return (
    <div className="fr-grid-row fr-grid-row--gutters">
      <div className="fr-col-12">
        <h3 className="fr-h3" style={{ marginBottom: "1rem", color: "var(--text-title-blue-france)" }}>
          ARML {armlData!.arml.nom}
        </h3>
      </div>
      <div className="fr-col-12">
        <h4 className="fr-h4" style={{ marginBottom: "1rem", color: "var(--text-title-blue-france)" }}>
          Indicateurs Globaux
        </h4>
      </div>
      <ARMLIndicateurGlobal armls={armlData!.mlList} />
    </div>
  );
}

export default function ARMLClient() {
  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <ARMLContent />
    </SuspenseWrapper>
  );
}
