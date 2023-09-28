import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";
import { useState } from "react";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { OrganismesFilterButton } from "./OrganismesFilterButton";

interface FiltreOrganismesEtatProps {
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

function FiltreOrganismesEtat(props: FiltreOrganismesEtatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const etats = props.value;

  return (
    <div>
      <OrganismesFilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Etat" badge={etats?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup
            value={props.value?.map((item) => item.toString())}
            onChange={(value) => props.onChange(value.map((v: string) => (v === "true" ? true : false)))}
          >
            <Stack>
              <Checkbox value="false" key="ouvert" fontSize="mini" size="sm">
                Ouvert
              </Checkbox>
              <Checkbox value="true" key="ferme" fontSize="mini" size="sm">
                Fermé
              </Checkbox>
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreOrganismesEtat;
