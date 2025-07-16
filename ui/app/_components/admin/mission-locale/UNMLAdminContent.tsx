"use client";

import { IMissionLocaleWithStats } from "shared";

import ARMLIndicateurGlobal from "@/app/_components/arml/ARMLIndicateurGlobal";

import { ARMLFilterPanel } from "./ARMLFilterPanel";
import UNMLAdminMissionsLocalesContent from "./UNMLAdminMissionsLocalesContent";

interface ARMLContentProps {
  unmlData: Array<IMissionLocaleWithStats>;
}

export default function UNMLAdminContent({ unmlData }: ARMLContentProps) {
  return (
    <div className="fr-grid-row fr-grid-row--gutters">
      <div className="fr-col-12">
        <h3 className="fr-h3" style={{ marginBottom: "1rem", color: "var(--text-title-blue-france)" }}>
          Pilotage des Missions Locales
        </h3>
      </div>
      <div className="fr-col-12">
        <ARMLFilterPanel />
      </div>
      <div className="fr-col-12">
        <h4 className="fr-h4" style={{ marginBottom: "1rem", color: "var(--text-title-blue-france)" }}>
          Indicateurs Globaux
        </h4>
      </div>
      <div className="fr-col-12">
        <ARMLIndicateurGlobal armls={unmlData} />
      </div>

      <div className="fr-col-12">
        <h4 className="fr-h4" style={{ marginBottom: "1rem", color: "var(--text-title-blue-france)" }}>
          Liste des Missions Locales
        </h4>
      </div>
      <div className="fr-col-12">
        <UNMLAdminMissionsLocalesContent unmlData={unmlData} />
      </div>
    </div>
  );
}
