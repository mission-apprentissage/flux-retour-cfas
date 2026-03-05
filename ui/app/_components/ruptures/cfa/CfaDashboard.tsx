"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { DECA_TOOLTIP_TEXT } from "@/common/types/cfaRuptures";
import type { ICfaRupturesResponse } from "@/common/types/cfaRuptures";

import styles from "./CfaDashboard.module.css";
import { CfaRupturesList } from "./CfaRupturesList";

interface CfaDashboardProps {
  data: ICfaRupturesResponse;
}

export function CfaDashboard({ data }: CfaDashboardProps) {
  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Effectifs en rupture de contrat (16-25 ans)</h1>
        <p className={styles.subtitle}>
          Retrouvez ici vos apprenants de{" "}
          <span className={styles.ageHighlight}>
            16 à 25 ans
            <span className={styles.infoIcon}>
              <Tooltip
                kind="hover"
                title="Les Missions Locales s'occupent du public jeune uniquement sur la tranche des 16 à 25 ans. Les apprenants âgés de plus de 25 ans ne pourront pas être renvoyés aux services des Missions Locales et ne sont donc pas éligibles à la collaboration via le Tableau de bord."
              />
            </span>
          </span>{" "}
          en rupture de contrat classés par date de rupture signalée. Les données sont issues de votre ERP ainsi que de
          la base de données <strong style={{ color: "var(--text-action-high-blue-france)" }}>DECA</strong>
          <span style={{ marginLeft: "0.25rem" }}>
            <Tooltip kind="hover" title={DECA_TOOLTIP_TEXT} />
          </span>
          .
        </p>
      </div>
      <CfaRupturesList segments={data} />
    </div>
  );
}
