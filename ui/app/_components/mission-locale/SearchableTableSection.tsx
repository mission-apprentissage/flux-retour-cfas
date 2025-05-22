"use client";

import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { memo } from "react";
import { IMissionLocaleEffectifList } from "shared";

import { MonthTable } from "./MonthTable";
import { PriorityTable } from "./PriorityTable";
import { EffectifPriorityData, MonthItem, SelectedSection } from "./types";

type SearchableTableSectionProps = {
  title: string;
  data: MonthItem[];
  priorityData?: EffectifPriorityData[];
  isTraite: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  handleSectionChange?: (section: SelectedSection) => void;
  listType: IMissionLocaleEffectifList;
};

export const SearchableTableSection = memo(function SearchableTableSection({
  title,
  data,
  priorityData,
  isTraite,
  searchTerm,
  onSearchChange,
  handleSectionChange,
  listType,
}: SearchableTableSectionProps) {
  return (
    <div>
      <h2 className="fr-h2 fr-text--blue-france fr-mb-2w" style={{ color: "var(--text-label-blue-cumulus)" }}>
        {title}
      </h2>
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
      {!isTraite && priorityData && priorityData.length > 0 && (
        <PriorityTable priorityData={priorityData} searchTerm={searchTerm} />
      )}
      {data.map((monthItem) => (
        <MonthTable
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
