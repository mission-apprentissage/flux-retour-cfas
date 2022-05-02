import { Box, Divider, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, FormationFilter, Page, Section, TerritoireFilter } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import { FiltersProvider, useFiltersContext } from "../FiltersContext";
import IndicateursGridSection from "../IndicateursGridSection";
import RepartitionEffectifsTerritoire from "./RepartitionEffectifsTerritoire";

const VisualiserLesIndicateursParTerritoirePage = () => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();

  return (
    <Page>
      <Section withShadow paddingY="3w">
        <BreadcrumbNav
          links={[NAVIGATION_PAGES.VisualiserLesIndicateurs, NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire]}
        />
        <Heading as="h1" marginTop="4w" marginBottom="3v">
          {NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire.title}
        </Heading>
        <HStack spacing="4w">
          <TerritoireFilter
            onDepartementChange={filtersContext.setters.setDepartement}
            onRegionChange={filtersContext.setters.setRegion}
            onTerritoireReset={filtersContext.setters.resetTerritoire}
            filters={filtersContext.state}
          />
          <HStack spacing="3v">
            <Box color="grey.800">Filtrer :</Box>
            <FormationFilter filters={filtersContext.state} onFormationChange={filtersContext.setters.setFormation} />
          </HStack>
        </HStack>
      </Section>
      <Divider color="#E7E7E7" orientation="horizontal" maxWidth="1230px" margin="auto" />
      <IndicateursGridSection effectifs={effectifs} loading={loading} showOrganismesCount />
      <RepartitionEffectifsTerritoire filters={filtersContext.state} />
    </Page>
  );
};

const T = () => {
  return (
    <FiltersProvider>
      <VisualiserLesIndicateursParTerritoirePage />
    </FiltersProvider>
  );
};

export default T;
