import { Box, Divider, Heading, HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { BreadcrumbNav, CfasFilter, Page, Section } from "../../../../common/components";
import CfaPanel from "../../../../common/components/CfasFilter/CfasPanel";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import { useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";
import OrganismeViewContent from "./OrganismeViewContent";

const IndicateursVueOrganismePage = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();

  const currentOrganisme = filtersContext.state.cfa;

  const organismeFilterLabel = userLoggedAsReseau
    ? `Sélectionner un organisme du réseau ${filtersContext.state.reseau.nom}`
    : "Sélectionner un organisme";

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
        {currentOrganisme ? (
          <CfasFilter
            filters={filtersContext.state}
            onCfaChange={filtersContext.setters.setCfa}
            defaultButtonLabel={organismeFilterLabel}
          />
        ) : (
          <Box marginY="3w" paddingX="8w" paddingY="6w" border="1px solid" borderColor="#E5E5E5">
            <CfaPanel filters={filtersContext.state} onCfaClick={filtersContext.setters.setCfa} value={null} />
          </Box>
        )}
      </Section>
      <Divider color="#E7E7E7" orientation="horizontal" maxWidth="1230px" margin="auto" />
      {Boolean(currentOrganisme) && (
        <OrganismeViewContent cfaUai={currentOrganisme.uai_etablissement} filters={filtersContext.state} />
      )}
    </Page>
  );
};

IndicateursVueOrganismePage.propTypes = {
  userLoggedAsReseau: PropTypes.bool,
};

export default IndicateursVueOrganismePage;
