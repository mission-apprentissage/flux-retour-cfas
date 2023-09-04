import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { BASSINS_EMPLOI_SORTED } from "shared";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";

interface FiltreOrganismeBassinEmploiProps {
  value: string[];
  onChange: (bassinsEmploi: string[]) => void;
}
const FiltreOrganismeBassinEmploi = (props: FiltreOrganismeBassinEmploiProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const bassinsEmploi = props.value;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Zone d’emploi" badge={bassinsEmploi.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="var(--chakra-sizes-lg)" p="3w">
          <CheckboxGroup
            defaultValue={bassinsEmploi}
            size="sm"
            onChange={(selected: string[]) => props.onChange(selected)}
          >
            <Stack>
              {BASSINS_EMPLOI_SORTED.map((region, i) => (
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

export default FiltreOrganismeBassinEmploi;
