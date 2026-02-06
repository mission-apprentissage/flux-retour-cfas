import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { DEPARTEMENTS_BY_CODE, DEPARTEMENTS_SORTED } from "shared";

import useAuth from "@/hooks/useAuth";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";
import FilterInfoLock from "../FilterInfoLock";

interface FiltreOrganismeDepartementProps {
  value: string[];
  onChange: (departements: string[]) => void;
}

const FiltreOrganismeDepartement = (props: FiltreOrganismeDepartementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = useAuth();
  const departements = props.value;
  const organisation = auth.organisation;

  const configDepartements = useMemo(() => {
    switch (organisation.type) {
      case "DDETS":
        return [];
      case "DREETS":
        return DEPARTEMENTS_SORTED.filter((departement) => departement.region.code === organisation.code_region);
      case "ACADEMIE":
        return DEPARTEMENTS_SORTED.filter((departement) => departement.academie.code === organisation.code_academie);
      default:
        return DEPARTEMENTS_SORTED;
    }
  }, []);

  if (organisation.type === "DDETS") {
    return (
      <FilterInfoLock
        value={`${organisation.code_departement} - ${DEPARTEMENTS_BY_CODE[organisation.code_departement]?.nom}`}
      />
    );
  }

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
              {configDepartements.map((departement, i) => (
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
