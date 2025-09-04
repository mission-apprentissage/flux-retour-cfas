"use client";

import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { memo } from "react";
import { IMissionLocaleEffectifList } from "shared";

import { EffectifPriorityData, MonthItem, SelectedSection } from "@/common/types/ruptures";

import { EffectifsMonthTable } from "./EffectifsMonthTable";
import { EffectifsPriorityTable } from "./EffectifsPriorityTable";

type EffectifsSearchableTableProps = {
  data: MonthItem[];
  priorityData?: EffectifPriorityData[];
  hadEffectifsPrioritaires?: boolean;
  isTraite: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  handleSectionChange?: (section: SelectedSection) => void;
  listType: IMissionLocaleEffectifList;
};

export const EffectifsSearchableTable = memo(function EffectifsSearchableTable({
  data,
  priorityData,
  hadEffectifsPrioritaires,
  isTraite,
  searchTerm,
  onSearchChange,
  handleSectionChange,
  listType,
}: EffectifsSearchableTableProps) {
  return (
    <div>
      <div>
        <SearchBar
          label="Rechercher un dossier par nom et/ou prénom"
          renderInput={({ id, className, placeholder }) => (
            <input
              id={id}
              className={className}
              placeholder={placeholder}
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          )}
        />
      </div>
      {!isTraite && (priorityData || hadEffectifsPrioritaires) && (
        <EffectifsPriorityTable
          priorityData={priorityData}
          searchTerm={searchTerm}
          hadEffectifsPrioritaires={hadEffectifsPrioritaires}
          listType={listType}
        />
      )}
      {data.map((monthItem) => (
        <EffectifsMonthTable
          key={monthItem.month}
          monthItem={monthItem}
          searchTerm={searchTerm}
          handleSectionChange={handleSectionChange}
          listType={listType}
        />
      ))}
    </div>
  );
});
