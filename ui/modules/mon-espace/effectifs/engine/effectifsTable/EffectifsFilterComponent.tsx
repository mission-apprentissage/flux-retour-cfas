import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";

import { capitalizeWords } from "@/common/utils/stringUtils";
import { FilterButton } from "@/components/FilterButton/FilterButton";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface EffectifsFilterComponentProps {
  filterKey: string;
  displayName: string;
  options: string[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sortOrder?: "asc" | "desc";
}

const EffectifsFilterComponent: React.FC<EffectifsFilterComponentProps> = ({
  filterKey,
  displayName,
  options,
  selectedValues,
  onChange,
  isOpen,
  setIsOpen,
  sortOrder = "asc",
}) => {
  const sortedOptions = [...options].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.localeCompare(b);
    }
    return b.localeCompare(a);
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
          <CheckboxGroup defaultValue={selectedValues} size="sm" onChange={onChange}>
            <Stack>
              {sortedOptions.map((option, index) => (
                <Checkbox key={index} value={option} iconSize="0.5rem">
                  {capitalizeWords(option)}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
};

export default EffectifsFilterComponent;
