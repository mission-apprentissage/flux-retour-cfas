import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";

import { DEPARTEMENTS_SORTED } from "@/common/constants/territoires";
import useAuth from "@/hooks/useAuth";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";

interface FiltreOrganismeDepartementProps {
  value: string[];
  onChange: (departements: string[]) => void;
}
const FiltreOrganismeDepartement = (props: FiltreOrganismeDepartementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = useAuth();
  const isVisible = !["DREETS", "DRAAF", "CONSEIL_REGIONAL", "DDETS", "ACADEMIE"].includes(auth.organisation.type);
  const departements = props.value;

  if (!isVisible) return null;

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Département" badge={departements.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="var(--chakra-sizes-lg)" p="3w">
          <CheckboxGroup
            defaultValue={departements}
            size="sm"
            onChange={(selectedDepartements: string[]) => props.onChange(selectedDepartements)}
          >
            <Stack>
              {DEPARTEMENTS_SORTED.map((departement, i) => (
                <Checkbox iconSize="0.5rem" value={departement.code} key={i}>
                  {departement.code} - {departement.nom}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
};

export default FiltreOrganismeDepartement;
