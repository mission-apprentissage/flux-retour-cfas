import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { REGIONS_SORTED } from "shared";

import { FilterButton } from "@/components/FilterButton/FilterButton";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FiltreUsersRegionTypesProps {
  value: string[];
  onChange: (regions: string[]) => void;
}

function FiltreUsersRegion(props: FiltreUsersRegionTypesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const regions = props.value;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Région" badge={regions?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup
            defaultValue={regions}
            size="sm"
            onChange={(selectedRegions: string[]) => props.onChange(selectedRegions)}
          >
            <Stack>
              {REGIONS_SORTED.map((region, i) => (
                <Checkbox iconSize="0.5rem" value={region.code} key={i}>
                  {region.nom}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreUsersRegion;
