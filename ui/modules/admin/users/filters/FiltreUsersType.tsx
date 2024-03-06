import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { TYPES_ORGANISATION } from "shared";

import { FilterButton } from "@/components/FilterButton/FilterButton";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FiltreUsersTypesProps {
  value: string[];
  onChange: (typesUtilisateurs: string[]) => void;
}

function FiltreUserTypes(props: FiltreUsersTypesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const typesUtilisateurs = props.value;

  return (
    <div>
      <FilterButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        buttonLabel="Type d'utilisateur"
        badge={typesUtilisateurs?.length}
      />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup
            defaultValue={typesUtilisateurs}
            size="sm"
            onChange={(selectedTypesUtilisateurs: string[]) => props.onChange(selectedTypesUtilisateurs)}
          >
            <Stack>
              {TYPES_ORGANISATION.map((option, index) => (
                <Checkbox iconSize="0.5rem" value={option.key} key={index}>
                  {option.nom}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreUserTypes;
