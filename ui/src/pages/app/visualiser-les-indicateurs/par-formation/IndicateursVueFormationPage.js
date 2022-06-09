import { Box, Divider, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, FormationFilter, Page, Section, TerritoireFilter } from "../../../../common/components";
import FormationFilterMenu from "../../../../common/components/FormationFilter/FormationFilterMenu";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import { useFiltersContext } from "../FiltersContext";
import IndicateursGridSection from "../IndicateursGridSection";
import SwitchViewButton from "../SwitchViewButton";
import InfosFormationSection from "./InfosFormationSection";
import RepartitionFormationParCfa from "./RepartitionFormationParCfa";

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
      <Divider color="#E7E7E7" orientation="horizontal" maxWidth="1230px" margin="auto" />
      {Boolean(currentFormation) && (
        <>
          <InfosFormationSection formationCfd={currentFormation.cfd} />
          <IndicateursGridSection effectifs={effectifs} loading={loading} showOrganismesCount />
          <RepartitionFormationParCfa filters={filtersContext.state} />
        </>
      )}
    </Page>
  );
};

export default IndicateursVueFormationPage;
