import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";

import { REGIONS_SORTED } from "@/common/constants/territoires";
import useAuth from "@/hooks/useAuth";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";

interface FiltreOrganismeRegionProps {
  value: string[];
  onChange: (regions: string[]) => void;
}
const FiltreOrganismeRegion = (props: FiltreOrganismeRegionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = useAuth();
  const isVisible = !["DREETS", "DRAAF", "CONSEIL_REGIONAL", "DDETS", "ACADEMIE"].includes(auth.organisation.type);
  const regions = props.value;

  if (!isVisible) return null;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Région" badge={regions.length} />
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
};

export default FiltreOrganismeRegion;
