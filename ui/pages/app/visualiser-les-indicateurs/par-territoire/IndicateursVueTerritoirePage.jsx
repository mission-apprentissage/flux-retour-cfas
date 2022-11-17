import { Box, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import { BreadcrumbNav, FormationFilter, Page, Section, TerritoireFilter } from "../../../../components";
import useEffectifs from "../../../../hooks/useEffectifs";
import { useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";
import IndicateursAndRepartitionEffectifsTerritoire from "./IndicateursAndRepartitionEffectifsTerritoire";

const IndicateursVueTerritoirePage = () => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();

  return (
    <Page>
      <Section withShadow paddingY="3w">
        <BreadcrumbNav
          links={[NAVIGATION_PAGES.VisualiserLesIndicateurs, NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire]}
        />
        <HStack marginTop="4w" marginBottom="3v" spacing="2w">
          <Heading as="h1">{NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire.title}</Heading>
          <SwitchViewButton />
        </HStack>
        <HStack spacing="4w">
          <TerritoireFilter
            onDepartementChange={filtersContext.setters.setDepartement}
            onRegionChange={filtersContext.setters.setRegion}
            onTerritoireReset={filtersContext.setters.resetTerritoire}
            filters={filtersContext.state}
          />
          <HStack spacing="3v">
            <Box color="grey.800">Filtrer :</Box>
            <FormationFilter
              filters={filtersContext.state}
              onFormationChange={filtersContext.setters.setFormation}
              variant="secondary"
            />
          </HStack>
        </HStack>
      </Section>
      <IndicateursAndRepartitionEffectifsTerritoire
        filters={filtersContext.state}
        effectifs={effectifs}
        loading={loading}
      />
    </Page>
  );
};

export default IndicateursVueTerritoirePage;
