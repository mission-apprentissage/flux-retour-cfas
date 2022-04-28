import { Box, Divider, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import { FiltersProvider, useFiltersContext } from "../../../tableau-de-bord/FiltersContext";
import { VueGlobaleSection } from "../../../tableau-de-bord/sections";
import FormationFilter from "../../../tableau-de-bord/sections/IndicesHeaderSection/FormationFilter/FormationFilter";
import TerritoireFilter from "../../../tableau-de-bord/sections/IndicesHeaderSection/TerritoireFilter/TerritoireFilter";
import useEffectifs from "../../../tableau-de-bord/useEffectifs";
import RepartitionEffectifsReseau from "../../../tableau-de-bord/views/ReseauView/RepartitionEffectifsReseau";
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
        <Heading as="h1" marginTop="4w" marginBottom="3v">
          {NAVIGATION_PAGES.VisualiserLesIndicateursParReseau.title}
        </Heading>
        <HStack spacing="4w">
          <ReseauSelect
            defaultIsOpen
            value={filtersContext.state.reseau}
            onReseauChange={filtersContext.setters.setReseau}
          />
          <HStack spacing="3v">
            <Box color="grey.800">Filtrer :</Box>
            <FormationFilter filters={filtersContext.state} onFormationChange={filtersContext.setters.setFormation} />
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
      {Boolean(filtersContext.state.reseau) && (
        <>
          <VueGlobaleSection effectifs={effectifs} loading={loading} showOrganismesCount />
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
