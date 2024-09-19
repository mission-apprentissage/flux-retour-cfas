import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";
import { useState } from "react";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../../../components/FilterButton/FilterButton";

interface FiltreOrganismeTransmissionProps {
  fieldName: string;
  value: string[];
  onChange: (value: string[]) => void;
}
function FiltreOrganismeTransmission(props: FiltreOrganismeTransmissionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const transmissions = props.value;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Transmission" badge={transmissions?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup value={props.value} onChange={(value) => props.onChange(value.map((v: string) => v))}>
            <Stack>
              <Checkbox value="recent" key={`${props.fieldName}_recent`} fontSize="mini" size="sm">
                Effectifs récemment transmis (&lt; 1 mois)
              </Checkbox>
              <Checkbox value="1_3_mois" key={`${props.fieldName}_1_3_mois`} fontSize="mini" size="sm">
                Effectifs transmis (entre 1 et 3 mois)
              </Checkbox>
              <Checkbox value="arrete" key={`${props.fieldName}_arrete`} fontSize="mini" size="sm">
                Arrêt des transmissions (&gt; 3 mois)
              </Checkbox>
              <Checkbox value="jamais" key={`${props.fieldName}_jamais`} fontSize="mini" size="sm">
                Effectifs jamais transmis
              </Checkbox>
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreOrganismeTransmission;
