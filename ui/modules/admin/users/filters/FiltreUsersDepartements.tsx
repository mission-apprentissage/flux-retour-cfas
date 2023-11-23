import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { DEPARTEMENTS_SORTED } from "shared";

import { FilterButton } from "@/components/FilterButton/FilterButton";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FiltreUsersDepartmentTypesProps {
  value: string[];
  onChange: (departements: string[]) => void;
}

function FiltreUsersDepartment(props: FiltreUsersDepartmentTypesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const departements = props.value;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Département" badge={departements?.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup
            defaultValue={departements}
            size="sm"
            onChange={(selectedDepartements: string[]) => props.onChange(selectedDepartements)}
          >
            <Stack>
              {DEPARTEMENTS_SORTED.map((departement, i) => (
                <Checkbox iconSize="0.5rem" value={departement.code} key={i}>
                  {departement.nom}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreUsersDepartment;
