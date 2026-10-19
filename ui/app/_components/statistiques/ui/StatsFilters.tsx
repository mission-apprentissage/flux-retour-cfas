"use client";

import { DropdownMenu, DropdownMenuButton } from "@/app/_components/common/DropdownMenu";

import { useStatsFilters } from "../hooks/useStatsFilters";

import { getPeriodOptions } from "./PeriodSelector";
import styles from "./StatsFilters.module.css";

export function StatsFilters() {
  const { period, setPeriod, territoire, territoireLabel, territoireOptions, setTerritoire } = useStatsFilters();
  // Calculées au rendu : l'option « Depuis janv. <année> » apparaît au 1er janvier sans redéploiement.
  const periodOptions = getPeriodOptions(true, true);

  const periodLabel = periodOptions.find((option) => option.value === period)?.label;

  return (
    <div className={styles.filters}>
      <DropdownMenu
        label={periodLabel}
        buttonIconId="ri-calendar-line"
        ariaLabel={`Période : ${periodLabel}`}
        priority="secondary"
        align="left"
      >
        {() =>
          periodOptions.map((option) => (
            <DropdownMenuButton
              key={option.value}
              selected={option.value === period}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </DropdownMenuButton>
          ))
        }
      </DropdownMenu>

      <DropdownMenu
        label={territoireLabel}
        buttonIconId="ri-map-pin-2-line"
        ariaLabel={`Territoire : ${territoireLabel}`}
        priority="secondary"
        align="left"
      >
        {() =>
          territoireOptions.map((option) => (
            <DropdownMenuButton
              key={option.value}
              selected={option.value === territoire}
              onClick={() => setTerritoire(option.value)}
            >
              {option.label}
            </DropdownMenuButton>
          ))
        }
      </DropdownMenu>
    </div>
  );
}
