import { Checkbox, CheckboxGroup, Stack, Input } from "@chakra-ui/react";
import { useState } from "react";

import { capitalizeWords } from "@/common/utils/stringUtils";
import { FilterButton } from "@/components/FilterButton/FilterButton";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FilterListSearchableProps {
  filterKey: string;
  displayName: string;
  options: Record<string, string>;
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sortOrder?: "asc" | "desc";
}

const FilterInput: React.FC<{ searchQuery: string; setSearchQuery: (query: string) => void }> = ({
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <Input
      placeholder="Rechercher..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      size="sm"
      mb={2}
    />
  );
};

export const FilterListSearchable: React.FC<FilterListSearchableProps> = ({
  filterKey,
  displayName,
  options,
  selectedValues,
  onChange,
  isOpen,
  setIsOpen,
  sortOrder = "asc",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const sortedOptions = Object.entries(options)
    .filter(([_key, value]) => value.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort(([_keyA, valA], [_keyB, valB]) => {
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  return (
    <div key={filterKey}>
      <FilterButton
        isOpen={isOpen}
        setIsOpen={() => setIsOpen(!isOpen)}
        buttonLabel={displayName}
        badge={selectedValues.length}
      />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <FilterInput searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <CheckboxGroup defaultValue={selectedValues} size="sm" onChange={onChange}>
            <Stack mt={2}>
              {sortedOptions.map(([key, value]) => (
                <Checkbox key={key} value={key} iconSize="0.5rem">
                  {capitalizeWords(value)}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
};
