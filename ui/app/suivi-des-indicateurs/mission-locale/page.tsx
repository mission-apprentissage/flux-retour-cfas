"use client";

import { Input } from "@codegouvfr/react-dsfr/Input";
import { useState, useEffect } from "react";

import { StatisticsSection } from "@/app/_components/statistiques/sections/StatisticsSection";
import { TraitementMLTable } from "@/app/_components/statistiques/tables/TraitementMLTable";
import commonStyles from "@/app/_components/statistiques/ui/common.module.css";
import { PeriodSelector, type Period } from "@/app/_components/statistiques/ui/PeriodSelector";

import styles from "./page.module.css";

export default function MissionLocalePage() {
  const [period, setPeriod] = useState<Period>("30days");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div>
      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M23 18.9999H22V8.99991H18V6.58569L12 0.585693L6 6.58569V8.99991H2V18.9999H1V20.9999H23V18.9999ZM6 19H4V11H6V19ZM18 11H20V19H18V11ZM11 12H13V19H11V12Z"
              fill="#6A6AF4"
            />
          </svg>
        </div>
        <h2 className={commonStyles.headerTitle}>Par Mission Locale</h2>
      </div>

      <div className={styles.searchContainer}>
        <Input
          label="Rechercher une Mission Locale"
          hideLabel
          nativeInputProps={{
            placeholder: "Rechercher une Mission Locale par nom...",
            value: searchInput,
            onChange: (e) => setSearchInput(e.target.value),
            type: "search",
          }}
          className={styles.searchInput}
        />
      </div>

      <StatisticsSection
        title="Toutes les Missions Locales"
        controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
        controlsPosition="below-left"
      >
        <TraitementMLTable period={period} search={debouncedSearch} hideDescription isAdmin={false} />
      </StatisticsSection>
    </div>
  );
}
