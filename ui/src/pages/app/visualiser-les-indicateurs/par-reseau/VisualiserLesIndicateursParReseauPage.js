import { Box, Divider, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, FormationFilter, Page, Section, TerritoireFilter } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import { FiltersProvider, useFiltersContext } from "../FiltersContext";
import IndicateursGridSection from "../IndicateursGridSection";
import SwitchViewButton from "../SwitchViewButton";
import RepartitionEffectifsReseau from "./RepartitionEffectifsReseau";
import ReseauSelect from "./ReseauSelect/ReseauSelect";

const VisualiserLesIndicateursParReseauPage = () => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();

  return (
    <Page>
      <Section withShadow paddingY="3w">
        <BreadcrumbNav
          links={[NAVIGATION_PAGES.VisualiserLesIndicateurs, NAVIGATION_PAGES.VisualiserLesIndicateursParReseau]}
        />
        <HStack marginTop="4w" marginBottom="3v" spacing="2w">
          <Heading as="h1">{NAVIGATION_PAGES.VisualiserLesIndicateursParReseau.title}</Heading>
          <SwitchViewButton />
        </HStack>
        <HStack spacing="4w">
          <ReseauSelect
            defaultIsOpen
            value={filtersContext.state.reseau}
            onReseauChange={filtersContext.setters.setReseau}
          />
          <HStack spacing="3v">
            <Box color="grey.800">Filtrer :</Box>
            <FormationFilter
              filters={filtersContext.state}
              onFormationChange={filtersContext.setters.setFormation}
              variant="secondary"
            />
            <TerritoireFilter
              onDepartementChange={filtersContext.setters.setDepartement}
              onRegionChange={filtersContext.setters.setRegion}
              onTerritoireReset={filtersContext.setters.resetTerritoire}
              filters={filtersContext.state}
              variant="secondary"
            />
          </HStack>
        </HStack>
      </Section>
      <Divider color="#E7E7E7" orientation="horizontal" maxWidth="1230px" margin="auto" />
      {Boolean(filtersContext.state.reseau) && (
        <>
          <IndicateursGridSection effectifs={effectifs} loading={loading} showOrganismesCount />
          <RepartitionEffectifsReseau filters={filtersContext.state} />
        </>
      )}
    </Page>
  );
};

const T = () => {
  return (
    <FiltersProvider>
      <VisualiserLesIndicateursParReseauPage />
    </FiltersProvider>
  );
};

export default T;
