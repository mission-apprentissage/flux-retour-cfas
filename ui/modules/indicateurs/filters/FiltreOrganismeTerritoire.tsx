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
import React, { Dispatch, SetStateAction, useMemo, useState } from "react";

import {
  REGIONS_SORTED,
  DEPARTEMENTS_SORTED,
  ACADEMIES_SORTED,
  REGIONS_BY_CODE,
  DEPARTEMENTS_BY_CODE,
  ACADEMIES_BY_CODE,
} from "@/common/constants/territoires";
import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

export interface FiltreOrganismeTerritoireConfig {
  defaultLabel?: string;
  disabled?: boolean;
  regions?: string[];
  departements?: string[];
  academies?: string[];
  bassinsEmploi?: string[];
}

interface FiltreOrganismeTerritoireProps {
  value: {
    regions: string[];
    departements: string[];
    academies: string[];
    bassinsEmploi: string[];
  };
  config?: FiltreOrganismeTerritoireConfig;
  onRegionsChange: (regions: string[]) => void;
  onDepartementsChange: (departements: string[]) => void;
  onAcademiesChange: (academies: string[]) => void;
  onBassinsEmploiChange: (bassinsEmploi: string[]) => void;
  button: ({
    isOpen,
    setIsOpen,
    buttonLabel,
  }: {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    buttonLabel: string;
  }) => JSX.Element;
}
const FiltreOrganismeTerritoire = (props: FiltreOrganismeTerritoireProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { regions, departements, academies } = props.value;

  const territoiresConfig = useMemo(() => {
    return {
      regions: REGIONS_SORTED.filter(
        (region) => !props.config?.regions || props.config?.regions?.includes(region.code)
      ),
      departements: [
        ...DEPARTEMENTS_SORTED.filter(
          (departement) => !props.config?.regions || props.config?.regions?.includes(departement.region.code)
        ),
        ...DEPARTEMENTS_SORTED.filter(
          (departement) => !props.config?.departements || props.config?.departements?.includes(departement.code)
        ),
      ],
      academies: ACADEMIES_SORTED.filter(
        (academie) => !props.config?.academies || props.config?.academies?.includes(academie.code)
      ),
    };
  }, [props.config]);

  const defaultLabel = props.config?.defaultLabel ?? "France";

  const buttonLabel = `${
    REGIONS_BY_CODE[regions?.[0]]?.nom ??
    ACADEMIES_BY_CODE[academies?.[0]]?.nom ??
    DEPARTEMENTS_BY_CODE[departements?.[0]]?.nom ??
    defaultLabel
  }${regions.length + academies.length + departements.length > 1 ? " + ..." : ""}`;

  return (
    <div>
      {props.button({ setIsOpen, isOpen, buttonLabel })}

      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)}>
          <Tabs variant="newsimple" fontSize="14px">
            <TabList mx={8} mt={2}>
              {territoiresConfig.regions.length > 0 && (
                <Tab fontSize="14px">Région ({territoiresConfig.regions.length})</Tab>
              )}
              {territoiresConfig.academies.length > 0 && (
                <Tab fontSize="14px">Académies ({territoiresConfig.academies.length})</Tab>
              )}
              {territoiresConfig.departements.length > 0 && (
                <Tab fontSize="14px">Départements ({territoiresConfig.departements.length})</Tab>
              )}
              {/* <Tab fontSize="14px">Bassins d’emploi ({BASSINS_EMPLOI_SORTED.length})</Tab> */}
            </TabList>
            <TabIndicator mt="-1.5px" height="4px" bg="bluefrance" borderRadius="1px" />
            <Divider size="md" borderBottomWidth="2px" opacity="1" />
            <TabPanels px={4}>
              {territoiresConfig.regions.length > 0 && (
                <TabPanel>
                  <CheckboxGroup
                    defaultValue={regions}
                    onChange={(selectedRegions: string[]) => props.onRegionsChange(selectedRegions)}
                  >
                    <Stack>
                      {territoiresConfig.regions.map((region, i) => (
                        <Checkbox value={region.code} key={i}>
                          {region.nom}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </TabPanel>
              )}

              {territoiresConfig.academies.length > 0 && (
                <TabPanel>
                  <CheckboxGroup
                    defaultValue={academies}
                    onChange={(selectedAcademies: string[]) => props.onAcademiesChange(selectedAcademies)}
                  >
                    <Stack>
                      {territoiresConfig.academies.map((academie, i) => (
                        <Checkbox value={academie.code} key={i}>
                          {academie.nom}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </TabPanel>
              )}

              {territoiresConfig.departements.length > 0 && (
                <TabPanel>
                  <CheckboxGroup
                    defaultValue={departements}
                    onChange={(selectedDepartements: string[]) => props.onDepartementsChange(selectedDepartements)}
                  >
                    <Stack>
                      {territoiresConfig.departements.map((departement, i) => (
                        <Checkbox value={departement.code} key={i}>
                          {departement.code} - {departement.nom}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </TabPanel>
              )}
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

export default FiltreOrganismeTerritoire;
