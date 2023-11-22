import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";

import { organisationTypes } from "@/common/internal/Organisation";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";
import { OrganismesFilterButton } from "@/modules/organismes/filters/OrganismesFilterButton";

interface FiltreUsersTypesProps {
  value: string[];
  onChange: (typesUtilisateurs: string[]) => void;
}

function FiltreUserTypes(props: FiltreUsersTypesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const typesUtilisateurs = props.value;

  return (
    <div>
      <OrganismesFilterButton
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
              {organisationTypes.map((type, i) => (
                <Checkbox iconSize="0.5rem" value={type} key={i}>
                  {type}
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
