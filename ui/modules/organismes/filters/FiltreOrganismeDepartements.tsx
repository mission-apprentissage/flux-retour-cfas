import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { DEPARTEMENTS_SORTED } from "shared";

import useAuth from "@/hooks/useAuth";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { OrganismesFilterButton } from "./OrganismesFilterButton";

interface FiltreOrganismeDepartementsProps {
  value: string[];
  onChange: (departements: string[]) => void;
}

function FiltreOrganismeDepartements(props: FiltreOrganismeDepartementsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = useAuth();

  const departements = props.value;
  const organisation = auth.organisation;

  const configDepartements = useMemo(() => {
    switch (organisation.type) {
      case "DREETS":
      case "DRAAF":
      case "CONSEIL_REGIONAL":
      case "CARIF_OREF_REGIONAL":
        return DEPARTEMENTS_SORTED.filter((departement) => departement.region.code === organisation.code_region);
      case "ACADEMIE":
        return DEPARTEMENTS_SORTED.filter((departement) => departement.academie.code === organisation.code_academie);
      default:
        return DEPARTEMENTS_SORTED;
    }
  }, []);

  return (
    <div>
      <OrganismesFilterButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        buttonLabel="Département"
        badge={departements?.length}
      />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="auto" p="3w">
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
}

export default FiltreOrganismeDepartements;
