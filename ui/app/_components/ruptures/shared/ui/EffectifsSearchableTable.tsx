"use client";

import { memo } from "react";
import { IMissionLocaleEffectifList } from "shared";

import { EffectifPriorityData, MonthItem } from "@/common/types/ruptures";

import { EffectifsMonthTable } from "./EffectifsMonthTable";
import { EffectifsPriorityTable } from "./EffectifsPriorityTable";

/** Recherche et filtres sont portés par la page, au-dessus des onglets (maquette). */
type EffectifsSearchableTableProps = {
  data: MonthItem[];
  priorityData?: EffectifPriorityData[];
  hadEffectifsPrioritaires?: boolean;
  isTraite: boolean;
  searchTerm: string;
  onVoirDossiersTraites?: (month: string) => void;
  listType: IMissionLocaleEffectifList;
  selectedPostalCodes?: string[];
};

export const EffectifsSearchableTable = memo(function EffectifsSearchableTable({
  data,
  priorityData,
  hadEffectifsPrioritaires,
  isTraite,
  searchTerm,
  onVoirDossiersTraites,
  listType,
  selectedPostalCodes = [],
}: EffectifsSearchableTableProps) {
  return (
    <div>
      {!isTraite && (priorityData || hadEffectifsPrioritaires) && (
        <div className="fr-mb-4w">
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
          onVoirDossiersTraites={onVoirDossiersTraites}
          listType={listType}
          selectedPostalCodes={selectedPostalCodes}
        />
      ))}
    </div>
  );
});
