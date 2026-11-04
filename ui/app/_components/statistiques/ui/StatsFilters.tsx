"use client";

import { DropdownMenu, DropdownMenuButton } from "@/app/_components/common/DropdownMenu";

import { useStatsFilters } from "../hooks/useStatsFilters";

import { getPeriodOptions } from "./PeriodSelector";
import styles from "./StatsFilters.module.css";

export function StatsFilters() {
  const {
    period,
    setPeriod,
    territoire,
    regionLabel,
    territoireOptions,
    setTerritoire,
    region,
    departement,
    departementOptions,
    setDepartement,
  } = useStatsFilters();
  const departementLabel = departementOptions.find((option) => option.value === departement)?.label;
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
        label={regionLabel}
        buttonIconId="ri-map-pin-2-line"
        ariaLabel={`Territoire : ${regionLabel}`}
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

      {region && (
        <DropdownMenu
          label={departementLabel ?? "Tous les départements"}
          buttonIconId="ri-map-pin-2-line"
          ariaLabel={`Département : ${departementLabel ?? "tous les départements"}`}
          priority="secondary"
          align="left"
        >
          {() => [
            <DropdownMenuButton key="tous" selected={!departement} onClick={() => setDepartement(null)}>
              Tous les départements
            </DropdownMenuButton>,
            ...departementOptions.map((option) => (
              <DropdownMenuButton
                key={option.value}
                selected={option.value === departement}
                onClick={() => setDepartement(option.value)}
              >
                {option.label}
              </DropdownMenuButton>
            )),
          ]}
        </DropdownMenu>
      )}
    </div>
  );
}
