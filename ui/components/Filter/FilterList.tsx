import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";

import { capitalizeWords } from "@/common/utils/stringUtils";
import { FilterButton } from "@/components/FilterButton/FilterButton";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FilterListProps {
  filterKey: string;
  displayName: string;
  options: Record<string, string>;
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sortOrder?: "asc" | "desc";
  withSortedOptions?: boolean;
}

export const FilterList: React.FC<FilterListProps> = ({
  filterKey,
  displayName,
  options,
  selectedValues,
  onChange,
  isOpen,
  setIsOpen,
  sortOrder = "asc",
  withSortedOptions = true,
}) => {
  const optionsEntries = Object.entries(options);
  const computedOptions = withSortedOptions
    ? optionsEntries.sort(([_keyA, valA], [_keyB, valB]) => {
        if (sortOrder === "asc") {
          return valA.localeCompare(valB);
        }
        return valB.localeCompare(valA);
      })
    : optionsEntries;

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
          <CheckboxGroup defaultValue={selectedValues} size="sm" onChange={onChange}>
            <Stack>
              {computedOptions.map(([key, value]) => (
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
