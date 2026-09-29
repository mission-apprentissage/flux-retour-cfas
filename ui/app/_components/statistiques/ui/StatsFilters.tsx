"use client";

import { DropdownMenu, DropdownMenuButton } from "@/app/_components/common/DropdownMenu";

import { useStatsFilters } from "../hooks/useStatsFilters";

import { getPeriodOptions } from "./PeriodSelector";
import styles from "./StatsFilters.module.css";

const PERIOD_OPTIONS = getPeriodOptions(true);

export function StatsFilters() {
  const { period, setPeriod, territoire, territoireLabel, territoireOptions, setTerritoire } = useStatsFilters();

  const periodLabel = PERIOD_OPTIONS.find((option) => option.value === period)?.label;

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
          PERIOD_OPTIONS.map((option) => (
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
