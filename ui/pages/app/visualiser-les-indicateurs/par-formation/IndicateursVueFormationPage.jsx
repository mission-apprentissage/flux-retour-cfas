import { Box, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import { BreadcrumbNav, FormationFilter, Page, Section, TerritoireFilter } from "../../../../components";
import FormationFilterMenu from "../../../../components/FormationFilter/FormationFilterMenu";
import useEffectifs from "../../../../hooks/useEffectifs";
import { useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";
import IndicateursAndRepartitionFormationParCfa from "./IndicateursAndRepartitionFormationParCfa";
import InfosFormationSection from "./InfosFormationSection";

const IndicateursVueFormationPage = () => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();

  const currentFormation = filtersContext.state.formation;

  return (
    <Page>
      <Section withShadow paddingY="3w">
        <BreadcrumbNav
          links={[NAVIGATION_PAGES.VisualiserLesIndicateurs, NAVIGATION_PAGES.VisualiserLesIndicateursParFormation]}
        />
        <HStack marginTop="4w" marginBottom="3v" spacing="2w">
          <Heading as="h1">{NAVIGATION_PAGES.VisualiserLesIndicateursParFormation.title}</Heading>
          <SwitchViewButton />
        </HStack>
        {currentFormation ? (
          <HStack spacing="4w">
            <FormationFilter filters={filtersContext.state} onFormationChange={filtersContext.setters.setFormation} />
            <HStack spacing="3v">
              <Box color="grey.800">Filtrer :</Box>
              <TerritoireFilter
                onDepartementChange={filtersContext.setters.setDepartement}
                onRegionChange={filtersContext.setters.setRegion}
                onTerritoireReset={filtersContext.setters.resetTerritoire}
                filters={filtersContext.state}
                variant="secondary"
              />
            </HStack>
          </HStack>
        ) : (
          <Box marginY="3w" paddingX="8w" paddingY="6w" border="1px solid" borderColor="#E5E5E5">
            <FormationFilterMenu
              filters={filtersContext.state}
              onFormationClick={filtersContext.setters.setFormation}
            />
          </Box>
        )}
      </Section>
      {Boolean(currentFormation) && (
        <>
          <InfosFormationSection formationCfd={currentFormation.cfd} />
          <IndicateursAndRepartitionFormationParCfa
            filters={filtersContext.state}
            effectifs={effectifs}
            loading={loading}
          />
        </>
      )}
    </Page>
  );
};

export default IndicateursVueFormationPage;
