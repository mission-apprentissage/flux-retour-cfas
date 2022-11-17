import { Box, Flex, Heading, HStack, Spacer } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages";
import { BreadcrumbNav, CfasFilter, Page, Section } from "../../../../components";
import { useFiltersContext } from "../../../../components/_pagesComponents/FiltersContext.js";
import CfaPanel from "../../../../components/CfasFilter/CfasPanel";
import useAuth from "../../../../hooks/useAuth";
import useFetchCfaInfo from "../../../../hooks/useFetchCfaInfo";
import SwitchViewButton from "../SwitchViewButton";
import OrganismeViewContent from "./OrganismeViewContent";

const IndicateursVueOrganismePage = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();

  const { data: infosCfa, loading, error } = useFetchCfaInfo(filtersContext?.state?.cfa?.uai_etablissement);
  const { auth } = useAuth();

  const currentOrganisme = filtersContext.state.cfa;
  const organismeFilterLabel = userLoggedAsReseau
    ? `Sélectionner un organisme du réseau ${auth.network}`
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
          <Flex>
            <CfasFilter
              filters={filtersContext.state}
              onCfaChange={filtersContext.setters.setCfa}
              defaultButtonLabel={organismeFilterLabel}
            />
            <Spacer />
          </Flex>
        ) : (
          <Box marginY="3w" paddingX="8w" paddingY="6w" border="1px solid" borderColor="#E5E5E5">
            <CfaPanel filters={filtersContext.state} onCfaClick={filtersContext.setters.setCfa} value={null} />
          </Box>
        )}
      </Section>
      {Boolean(currentOrganisme) && (
        <OrganismeViewContent infosCfa={infosCfa} loading={loading} error={error} filters={filtersContext.state} />
      )}
    </Page>
  );
};

IndicateursVueOrganismePage.propTypes = {
  userLoggedAsReseau: PropTypes.bool,
};

export default IndicateursVueOrganismePage;
