"use client";

import { memo } from "react";
import { IMissionLocaleEffectifList } from "shared";

import { EffectifPriorityData, MonthItem, SelectedSection } from "@/common/types/ruptures";

import { EffectifsMonthTable } from "./EffectifsMonthTable";
import { EffectifsPriorityTable } from "./EffectifsPriorityTable";

/** Recherche et filtres sont portés par la page, au-dessus des onglets (maquette). */
type EffectifsSearchableTableProps = {
  data: MonthItem[];
  priorityData?: EffectifPriorityData[];
  hadEffectifsPrioritaires?: boolean;
  isTraite: boolean;
  searchTerm: string;
  handleSectionChange?: (section: SelectedSection) => void;
  listType: IMissionLocaleEffectifList;
  selectedPostalCodes?: string[];
};

export const EffectifsSearchableTable = memo(function EffectifsSearchableTable({
  data,
  priorityData,
  hadEffectifsPrioritaires,
  isTraite,
  searchTerm,
  handleSectionChange,
  listType,
  selectedPostalCodes = [],
}: EffectifsSearchableTableProps) {
  return (
    <div>
      {!isTraite && (priorityData || hadEffectifsPrioritaires) && (
        <div style={{ marginBottom: "2rem" }}>
          <EffectifsPriorityTable
            priorityData={priorityData}
            searchTerm={searchTerm}
            hadEffectifsPrioritaires={hadEffectifsPrioritaires}
            listType={listType}
            selectedPostalCodes={selectedPostalCodes}
          />
        </div>
      )}
      {data.map((monthItem) => (
        <EffectifsMonthTable
          key={monthItem.month}
          monthItem={monthItem}
          searchTerm={searchTerm}
          handleSectionChange={handleSectionChange}
          listType={listType}
          selectedPostalCodes={selectedPostalCodes}
        />
      ))}
    </div>
  );
});
