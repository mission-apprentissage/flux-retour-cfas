import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";
import { useState } from "react";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { OrganismesFilterButton } from "./OrganismesFilterButton";

interface FiltreOrganismesNatureProps {
  value: string[];
  onChange: (value: string[]) => void;
}

function FiltreOrganismesNature(props: FiltreOrganismesNatureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const natures = props.value;

  return (
    <div>
      <OrganismesFilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Nature" badge={natures?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup value={props.value} onChange={(value) => props.onChange(value.map((v: string) => v))}>
            <Stack>
              <Checkbox value="responsable" key="responsable" fontSize="mini" size="sm">
                Responsable
              </Checkbox>
              <Checkbox value="formateur" key="formateur" fontSize="mini" size="sm">
                Formateur
              </Checkbox>
              <Checkbox value="responsable_formateur" key="responsable_formateur" fontSize="mini" size="sm">
                Responsable formateur
              </Checkbox>
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreOrganismesNature;
