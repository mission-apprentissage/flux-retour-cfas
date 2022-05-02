import { Divider, Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, CfasFilter, Page, Section } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import { FiltersProvider, useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";
import OrganismeViewContent from "./OrganismeViewContent";

const VisualiserLesIndicateursParOrganismePage = () => {
  const filtersContext = useFiltersContext();

  return (
    <Page>
      <Section withShadow paddingY="3w">
        <BreadcrumbNav
          links={[NAVIGATION_PAGES.VisualiserLesIndicateurs, NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme]}
        />
        <HStack marginTop="4w" marginBottom="3v" spacing="2w">
          <Heading as="h1">{NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.title}</Heading>
          <SwitchViewButton />
        </HStack>
        <CfasFilter filters={filtersContext.state} onCfaChange={filtersContext.setters.setCfa} />
      </Section>
      <Divider color="#E7E7E7" orientation="horizontal" maxWidth="1230px" margin="auto" />
      {Boolean(filtersContext.state.cfa) && (
        <OrganismeViewContent cfaUai={filtersContext.state.cfa.uai_etablissement} filters={filtersContext.state} />
      )}
    </Page>
  );
};

const T = () => {
  return (
    <FiltersProvider>
      <VisualiserLesIndicateursParOrganismePage />
    </FiltersProvider>
  );
};

export default T;
