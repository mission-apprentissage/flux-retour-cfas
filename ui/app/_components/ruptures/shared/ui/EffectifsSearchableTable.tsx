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
  onDownloadMonth?: (month: string, listType: IMissionLocaleEffectifList) => void;
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
  onDownloadMonth,
}: EffectifsSearchableTableProps) {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
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
        <div style={{ marginBottom: "2rem" }}>
          <EffectifsPriorityTable
            priorityData={priorityData}
            searchTerm={searchTerm}
            hadEffectifsPrioritaires={hadEffectifsPrioritaires}
            listType={listType}
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
          onDownloadMonth={onDownloadMonth}
        />
      ))}
    </div>
  );
});
