import { Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useState } from "react";

import { REGIONS_BY_CODE, REGIONS_SORTED } from "@/common/constants/territoires";
import { OrganisationOperateurPublicRegion } from "@/common/internal/Organisation";
import useAuth from "@/hooks/useAuth";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { FilterButton } from "../FilterButton";
import FilterInfoLock from "../FilterInfoLock";

interface FiltreOrganismeRegionProps {
  value: string[];
  onChange: (regions: string[]) => void;
}

function isOrganisationOperateurPublicRegion(organisation): organisation is OrganisationOperateurPublicRegion {
  return (
    organisation.type === "DREETS" ||
    organisation.type === "DRAAF" ||
    organisation.type === "CONSEIL_REGIONAL" ||
    organisation.type === "CARIF_OREF_REGIONAL"
  );
}

const FiltreOrganismeRegion = (props: FiltreOrganismeRegionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = useAuth();
  const organisation = auth.organisation;
  const regions = props.value;

  if (["DDETS", "ACADEMIE"].includes(organisation.type)) return null;
  if (isOrganisationOperateurPublicRegion(organisation)) {
    return <FilterInfoLock value={REGIONS_BY_CODE[organisation.code_region]?.nom} />;
  }

  return (
    <div>
      <FilterButton isOpen={isOpen} setIsOpen={setIsOpen} buttonLabel="Région" badge={regions.length} />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="var(--chakra-sizes-lg)" p="3w">
          <CheckboxGroup
            defaultValue={regions}
            size="sm"
            onChange={(selectedRegions: string[]) => props.onChange(selectedRegions)}
          >
            <Stack>
              {REGIONS_SORTED.map((region, i) => (
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

export default FiltreOrganismeRegion;
