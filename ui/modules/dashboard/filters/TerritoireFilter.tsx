import {
  Checkbox,
  CheckboxGroup,
  Divider,
  Stack,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import React, { useState } from "react";

import {
  REGIONS_SORTED,
  DEPARTEMENTS_SORTED,
  ACADEMIES_SORTED,
  REGIONS_BY_ID,
  DEPARTEMENTS_BY_ID,
  ACADEMIES_BY_ID,
} from "@/common/constants/territoiresConstants";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";

import SimpleOverlayMenu from "../SimpleOverlayMenu";

interface Props {
  value: {
    regions: string[];
    departements: string[];
    academies: string[];
    bassinsEmploi: string[];
  };
  onRegionsChange: (regions: string[]) => void;
  onDepartementsChange: (departements: string[]) => void;
  onAcademiesChange: (academies: string[]) => void;
  onBassinsEmploiChange: (bassinsEmploi: string[]) => void;
}
const TerritoireFilter = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { regions, departements, academies } = props.value;

  REGIONS_BY_ID[regions?.[0]]?.nom;
  const buttonLabel = `${
    REGIONS_BY_ID[regions?.[0]]?.nom ??
    ACADEMIES_BY_ID[academies?.[0]]?.nom ??
    DEPARTEMENTS_BY_ID[departements?.[0]]?.nom ??
    "France"
  }${regions.length + academies.length + departements.length > 1 ? " + ..." : ""}`;

  return (
    <div>
      <SecondarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
        {buttonLabel}
      </SecondarySelectButton>

      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)}>
          <Tabs variant="newsimple" fontSize="14px">
            <TabList mx={8} mt={2}>
              <Tab fontSize="14px">Région ({REGIONS_SORTED.length})</Tab>
              <Tab fontSize="14px">Académies ({ACADEMIES_SORTED.length})</Tab>
              <Tab fontSize="14px">Départements ({DEPARTEMENTS_SORTED.length})</Tab>
              {/* <Tab fontSize="14px">Bassins d’emploi ({BASSINS_EMPLOI_SORTED.length})</Tab> */}
            </TabList>
            <TabIndicator mt="-1.5px" height="4px" bg="bluefrance" borderRadius="1px" />
            <Divider size="md" borderBottomWidth="2px" opacity="1" />
            <TabPanels px={4}>
              <TabPanel>
                <CheckboxGroup
                  defaultValue={regions}
                  onChange={(selectedRegions: string[]) => props.onRegionsChange(selectedRegions)}
                >
                  <Stack>
                    {REGIONS_SORTED.map((region, i) => (
                      <Checkbox value={region.code} key={i}>
                        {region.nom}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </TabPanel>
              <TabPanel>
                <CheckboxGroup
                  defaultValue={academies}
                  onChange={(selectedAcademies: string[]) => props.onAcademiesChange(selectedAcademies)}
                >
                  <Stack>
                    {ACADEMIES_SORTED.map((academie, i) => (
                      <Checkbox value={academie.code} key={i}>
                        {academie.nom}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </TabPanel>
              <TabPanel>
                <CheckboxGroup
                  defaultValue={departements}
                  onChange={(selectedDepartements: string[]) => props.onDepartementsChange(selectedDepartements)}
                >
                  <Stack>
                    {DEPARTEMENTS_SORTED.map((departement, i) => (
                      <Checkbox value={departement.code} key={i}>
                        {departement.nom}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </TabPanel>
              {/* <TabPanel>
                <CheckboxGroup
                  defaultValue={bassinsEmploi}
                  onChange={(selectedBassinsEmploi: string[]) => props.onBassinsEmploiChange(selectedBassinsEmploi)}
                >
                  <Stack>
                    {BASSINS_EMPLOI_SORTED.map((bassinEmploi, i) => (
                      <Checkbox value={bassinEmploi.code} key={i}>
                        {bassinEmploi.nom}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </TabPanel> */}
            </TabPanels>
          </Tabs>
        </SimpleOverlayMenu>
      )}
    </div>
  );
};

export default TerritoireFilter;
