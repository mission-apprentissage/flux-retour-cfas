import { Box, Divider, Heading, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { BreadcrumbNav, FormationFilter, Page, Section, TerritoireFilter } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import { useFiltersContext } from "../FiltersContext";
import IndicateursGridSection from "../IndicateursGridSection";
import SwitchViewButton from "../SwitchViewButton";
import RepartitionEffectifsReseau from "./RepartitionEffectifsReseau";
import ReseauSelect from "./ReseauSelect/ReseauSelect";
import ReseauUpdateContactSection from "./ReseauUpdateContactSection";

const IndicateursVueReseauPage = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();

  const currentReseau = filtersContext.state.reseau;

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
          {userLoggedAsReseau ? (
            <Text fontWeight="bold" fontSize="gamma">
              Réseau {currentReseau.nom}
            </Text>
          ) : (
            <ReseauSelect
              defaultIsOpen={!currentReseau}
              value={currentReseau}
              onReseauChange={filtersContext.setters.setReseau}
            />
          )}
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
      {userLoggedAsReseau && <ReseauUpdateContactSection />}
      <Divider color="#E7E7E7" orientation="horizontal" maxWidth="1230px" margin="auto" />
      {Boolean(currentReseau) && (
        <>
          <IndicateursGridSection effectifs={effectifs} loading={loading} showOrganismesCount />
          <RepartitionEffectifsReseau filters={filtersContext.state} />
        </>
      )}
    </Page>
  );
};

IndicateursVueReseauPage.propTypes = {
  userLoggedAsReseau: PropTypes.bool,
};

export default IndicateursVueReseauPage;
