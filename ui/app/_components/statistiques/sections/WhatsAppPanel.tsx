"use client";

import { useState } from "react";

import { PeriodSelector, type Period } from "../ui/PeriodSelector";

import { PrequalifSection } from "./PrequalifSection";
import styles from "./WhatsAppPanel.module.css";
import { WhatsAppSection } from "./WhatsAppSection";

export function WhatsAppPanel() {
  const [period, setPeriod] = useState<Period>("all");

  return (
    <div>
      <div className={styles.periodSelector}>
        <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
      </div>
      <WhatsAppSection period={period} />
      <PrequalifSection period={period} />
    </div>
  );
}
