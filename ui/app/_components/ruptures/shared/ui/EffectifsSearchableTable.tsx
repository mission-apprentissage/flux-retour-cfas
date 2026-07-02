"use client";

import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { memo } from "react";
import { IMissionLocaleEffectifList } from "shared";

import { PostalCodeOption } from "@/app/_utils/ruptures.utils";
import { EffectifPriorityData, MonthItem, SelectedSection } from "@/common/types/ruptures";

import { EffectifsMonthTable } from "./EffectifsMonthTable";
import { EffectifsPriorityTable } from "./EffectifsPriorityTable";
import { VillesFilter } from "./VillesFilter";

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
  showVillesFilter?: boolean;
  postalCodeOptions?: PostalCodeOption[];
  selectedPostalCodes?: string[];
  onPostalCodesChange?: (value: string[]) => void;
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
  showVillesFilter = false,
  postalCodeOptions = [],
  selectedPostalCodes = [],
  onPostalCodesChange,
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
      {showVillesFilter && postalCodeOptions.length > 0 && onPostalCodesChange && (
        <VillesFilter options={postalCodeOptions} value={selectedPostalCodes} onChange={onPostalCodesChange} />
      )}
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
          onDownloadMonth={onDownloadMonth}
          selectedPostalCodes={selectedPostalCodes}
        />
      ))}
    </div>
  );
});
