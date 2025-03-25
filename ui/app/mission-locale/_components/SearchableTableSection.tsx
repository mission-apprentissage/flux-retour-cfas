"use client";

import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { memo } from "react";

import { MonthTable } from "./MonthTable";
import { MonthItem } from "./types";

type SearchableTableSectionProps = {
  title: string;
  data: MonthItem[];
  isTraite: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  handleSectionChange?: (section: "a-traiter" | "deja-traite") => void;
};

export const SearchableTableSection = memo(function SearchableTableSection({
  title,
  data,
  isTraite,
  searchTerm,
  onSearchChange,
  handleSectionChange,
}: SearchableTableSectionProps) {
  return (
    <div>
      <h2 className="fr-h2 fr-text--blue-france fr-mb-2w" style={{ color: "var(--text-label-blue-cumulus)" }}>
        {title}
      </h2>
      <div>
        <SearchBar
          label="Rechercher par nom, prénom ou cfa"
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
      {data.map((monthItem) => (
        <MonthTable
          key={monthItem.month}
          monthItem={monthItem}
          isTraite={isTraite}
          searchTerm={searchTerm}
          handleSectionChange={handleSectionChange}
        />
      ))}
    </div>
  );
});
