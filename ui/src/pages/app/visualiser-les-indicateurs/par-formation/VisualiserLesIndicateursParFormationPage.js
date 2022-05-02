import { Box, Divider, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, FormationFilter, Page, Section, TerritoireFilter } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import { FiltersProvider, useFiltersContext } from "../FiltersContext";
import IndicateursGridSection from "../IndicateursGridSection";
import SwitchViewButton from "../SwitchViewButton";
import InfosFormationSection from "./InfosFormationSection";
import RepartitionFormationParCfa from "./RepartitionFormationParCfa";

const VisualiserLesIndicateursParFormationPage = () => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();

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
        <HStack spacing="4w">
          <FormationFilter filters={filtersContext.state} onFormationChange={filtersContext.setters.setFormation} />
          <HStack spacing="3v">
            <Box color="grey.800">Filtrer :</Box>
            <TerritoireFilter
              onDepartementChange={filtersContext.setters.setDepartement}
              onRegionChange={filtersContext.setters.setRegion}
              onTerritoireReset={filtersContext.setters.resetTerritoire}
              filters={filtersContext.state}
            />
          </HStack>
        </HStack>
      </Section>
      <Divider color="#E7E7E7" orientation="horizontal" maxWidth="1230px" margin="auto" />
      {Boolean(filtersContext.state.formation) && (
        <>
          <InfosFormationSection formationCfd={filtersContext.state.formation.cfd} />
          <IndicateursGridSection effectifs={effectifs} loading={loading} showOrganismesCount />
          <RepartitionFormationParCfa filters={filtersContext.state} />
        </>
      )}
    </Page>
  );
};

const T = () => {
  return (
    <FiltersProvider>
      <VisualiserLesIndicateursParFormationPage />
    </FiltersProvider>
  );
};

export default T;
