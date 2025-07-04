"use client";

import { IOrganisationARML, IMissionLocaleWithStats } from "shared";

import ARMLIndicateurGlobal from "@/app/_components/arml/ARMLIndicateurGlobal";

interface ARMLContentProps {
  armlData: { arml: IOrganisationARML; mlList: Array<IMissionLocaleWithStats> };
}

export default function ARMLContent({ armlData }: ARMLContentProps) {
  return (
    <div className="fr-grid-row fr-grid-row--gutters">
      <div className="fr-col-12">
        <h2 className="fr-h2" style={{ marginBottom: "1rem", color: "var(--text-title-blue-france)" }}>
          Indicateurs Globaux
        </h2>
      </div>
      <ARMLIndicateurGlobal armls={armlData!.mlList} />
    </div>
  );
}
