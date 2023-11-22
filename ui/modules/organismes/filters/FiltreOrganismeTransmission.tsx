import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";
import { useState } from "react";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../../../components/FilterButton/FilterButton";

interface FiltreOrganismeTransmissionProps {
  fieldName: string;
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

function FiltreOrganismeTransmission(props: FiltreOrganismeTransmissionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const transmissions = props.value;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Transmission" badge={transmissions?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup
            value={props.value?.map((item) => item.toString())}
            onChange={(value) => props.onChange(value.map((v: string) => (v === "true" ? true : false)))}
          >
            <Stack>
              <Checkbox value="true" key={`${props.fieldName}_true`} fontSize="mini" size="sm">
                Transmet ou a déja transmis
              </Checkbox>
              <Checkbox value="false" key={`${props.fieldName}_false`} fontSize="mini" size="sm">
                Ne transmet pas
              </Checkbox>
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreOrganismeTransmission;
