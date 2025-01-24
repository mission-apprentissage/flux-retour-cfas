import { Radio, RadioGroup, Stack } from "@chakra-ui/react";

import { FilterButton } from "@/components/FilterButton/FilterButton";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FilterRadioProps {
  filterKey: string;
  displayName: string;
  options: Record<string, string>;
  selectedValue: string | null;
  onChange: (selectedValue: string | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const FilterRadio: React.FC<FilterRadioProps> = ({
  filterKey,
  displayName,
  options,
  selectedValue,
  onChange,
  isOpen,
  setIsOpen,
}) => {
  return (
    <div key={filterKey}>
      <FilterButton
        isOpen={isOpen}
        setIsOpen={() => setIsOpen(!isOpen)}
        buttonLabel={displayName}
        badge={selectedValue ? 1 : 0}
      />

      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <RadioGroup value={selectedValue || ""} onChange={(value) => onChange(value || null)}>
            <Stack>
              {Object.entries(options).map(([key, value]) => (
                <Radio key={key} value={key}>
                  {value}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
};

export default FilterRadio;
