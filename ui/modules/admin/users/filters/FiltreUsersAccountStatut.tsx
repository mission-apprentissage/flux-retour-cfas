import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";

import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";
import { FilterButton } from "@/components/FilterButton/FilterButton";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FiltreUsersAccountStatutTypesProps {
  value: string[];
  onChange: (statutsCompte: string[]) => void;
}

function FiltreUsersAccountStatut(props: FiltreUsersAccountStatutTypesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const statutsCompte = props.value;

  return (
    <div>
      <FilterButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        buttonLabel="Statut du compte"
        badge={statutsCompte?.length}
      />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
          <CheckboxGroup
            defaultValue={statutsCompte}
            size="sm"
            onChange={(selectedAccountStatuts: string[]) => props.onChange(selectedAccountStatuts)}
          >
            <Stack>
              <Checkbox iconSize="0.5rem" value="CONFIRMED" key="CONFIRMED">
                {USER_STATUS_LABELS.CONFIRMED}
              </Checkbox>
              <Checkbox iconSize="0.5rem" value="PENDING_EMAIL_VALIDATION" key="PENDING_EMAIL_VALIDATION">
                {USER_STATUS_LABELS.PENDING_EMAIL_VALIDATION}
              </Checkbox>
              <Checkbox iconSize="0.5rem" value="PENDING_ADMIN_VALIDATION" key="PENDING_ADMIN_VALIDATION">
                {USER_STATUS_LABELS.PENDING_ADMIN_VALIDATION}
              </Checkbox>
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreUsersAccountStatut;
