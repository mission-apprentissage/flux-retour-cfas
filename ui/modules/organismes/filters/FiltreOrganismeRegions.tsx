import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { REGIONS_SORTED } from "shared";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { OrganismesFilterButton } from "./OrganismesFilterButton";

interface FiltreOrganismeRegionsProps {
  value: string[];
  onChange: (regions: string[]) => void;
}

function FiltreOrganismeRegions(props: FiltreOrganismeRegionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const regions = props.value;

  return (
    <div>
      <OrganismesFilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Région" badge={regions?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="var(--chakra-sizes-lg)" p="3w">
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

export default FiltreOrganismeRegions;
