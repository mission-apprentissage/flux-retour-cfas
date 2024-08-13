import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";
import { useState } from "react";
import { UAI_INCONNUE_CAPITALIZE } from "shared";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../../../components/FilterButton/FilterButton";

interface FiltreOrganismeUaiProps {
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

function FiltreOrganismeUai(props: FiltreOrganismeUaiProps) {
  const [isOpen, setIsOpen] = useState(false);
  const etatUAI = props.value;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="UAI" badge={etatUAI?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup
            value={props.value?.map((item) => item.toString())}
            onChange={(value) => props.onChange(value.map((v: string) => (v === "true" ? true : false)))}
          >
            <Stack>
              <Checkbox value="true" key="connu" fontSize="mini" size="sm">
                Connue
              </Checkbox>
              <Checkbox value="false" key="inconnu" fontSize="mini" size="sm">
                {UAI_INCONNUE_CAPITALIZE}
              </Checkbox>
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreOrganismeUai;
