import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  ACADEMIES_DEPARTEMENT_MAP,
  DEPARTEMENTS_BY_CODE,
  DEPARTEMENTS_SORTED,
  IOrganisationOperateurPublicAcademie,
  IOrganisationOperateurPublicRegion,
  ORGANISATION_TYPE,
} from "shared";

import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";
import useAuth from "@/hooks/useAuth";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

interface FiltreAffelnetDepartementProps {
  value: string[];
  onChange: (departements: string[]) => void;
}

const FiltreAffelnetDepartement = (props: FiltreAffelnetDepartementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = useAuth();
  const departements = props.value;
  const organisation = auth.organisation as any;

  const configDepartements = useMemo(() => {
    if (organisation.type === ORGANISATION_TYPE.DREETS) {
      return DEPARTEMENTS_SORTED.filter(
        (departement) => departement.region.code === (organisation as IOrganisationOperateurPublicRegion).code_region
      );
    }
    if (organisation.type === ORGANISATION_TYPE.ACADEMIE) {
      return DEPARTEMENTS_SORTED.filter((departement) =>
        ACADEMIES_DEPARTEMENT_MAP[(organisation as IOrganisationOperateurPublicAcademie).code_academie].includes(
          departement.code
        )
      );
    }
    return [];
  }, [organisation]);

  const buttonLabel = departements.length
    ? departements
        .map((code) => DEPARTEMENTS_BY_CODE[code]?.nom)
        .join(", ")
        .substring(0, 30) + (departements.length > 3 ? "..." : "")
    : "Département";

  return (
    <div>
      <SecondarySelectButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        buttonLabel={buttonLabel}
        badge={departements.length}
        onClick={() => setIsOpen(!isOpen)}
      >
        {buttonLabel}
      </SecondarySelectButton>
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

export default FiltreAffelnetDepartement;
