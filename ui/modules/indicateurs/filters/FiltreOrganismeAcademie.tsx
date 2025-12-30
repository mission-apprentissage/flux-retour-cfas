import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { ACADEMIES_BY_CODE, ACADEMIES_SORTED } from "shared";

import useAuth from "@/hooks/useAuth";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";
import FilterInfoLock from "../FilterInfoLock";

interface FiltreOrganismeAcademieProps {
  value: string[];
  onChange: (academies: string[]) => void;
}
const FiltreOrganismeAcademie = (props: FiltreOrganismeAcademieProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = useAuth();
  const organisation = auth.organisation;
  const isHidden = organisation.type === "CONSEIL_REGIONAL";
  const academies = props.value;

  if (isHidden) return null;
  if (organisation.type === "ACADEMIE") {
    return <FilterInfoLock value={`Académie de ${ACADEMIES_BY_CODE[organisation.code_academie]?.nom}`} />;
  }

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Académies" badge={academies.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="var(--chakra-sizes-lg)" p="3w">
          <CheckboxGroup
            defaultValue={academies}
            size="sm"
            onChange={(selectedAcademies: string[]) => props.onChange(selectedAcademies)}
          >
            <Stack>
              {ACADEMIES_SORTED.map((region, i) => (
                <Checkbox iconSize="0.5rem" value={region.code} key={i}>
                  {region.nom}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </SimpleOverlayMenu>
      )}
    </div>
  );
};

export default FiltreOrganismeAcademie;
