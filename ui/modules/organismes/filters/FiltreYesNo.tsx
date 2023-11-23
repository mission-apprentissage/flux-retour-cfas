import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";
import { useState } from "react";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../../../components/FilterButton/FilterButton";

interface FiltreYesNoProps {
  fieldName: string;
  filterLabel: string;
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

function FiltreYesNo(props: FiltreYesNoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectionItems = props.value;
  const buttonLabel = props.filterLabel;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel={buttonLabel} badge={selectionItems?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup
            value={props.value?.map((item) => item.toString())}
            onChange={(value) => props.onChange(value.map((v: string) => (v === "true" ? true : false)))}
          >
            <Stack>
              <Checkbox value="true" key={`${props.fieldName}_true`} fontSize="mini" size="sm">
                Oui
              </Checkbox>
              <Checkbox value="false" key={`${props.fieldName}_false`} fontSize="mini" size="sm">
                Non
              </Checkbox>
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreYesNo;
