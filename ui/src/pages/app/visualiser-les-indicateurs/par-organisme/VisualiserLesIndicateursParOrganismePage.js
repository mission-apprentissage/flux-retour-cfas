import { Divider, Heading } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import { FiltersProvider, useFiltersContext } from "../../../tableau-de-bord/FiltersContext";
import CfasFilter from "../../../tableau-de-bord/sections/IndicesHeaderSection/CfasFilter/CfasFilter";
import OrganismeViewContent from "./OrganismeViewContent";

const VisualiserLesIndicateursParOrganismePage = () => {
  const filtersContext = useFiltersContext();

  return (
    <Page>
      <Section withShadow paddingY="3w">
        <BreadcrumbNav
          links={[NAVIGATION_PAGES.VisualiserLesIndicateurs, NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme]}
        />
        <Heading as="h1" marginTop="4w" marginBottom="3v">
          {NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.title}
        </Heading>
        <CfasFilter filters={filtersContext.state} onCfaChange={filtersContext.setters.setCfa} />
        {/* <pre>{JSON.stringify(filtersContext.state, null, 2)}</pre> */}
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
