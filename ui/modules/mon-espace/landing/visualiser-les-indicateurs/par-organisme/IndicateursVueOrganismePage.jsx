import { Box, Flex, Heading, HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import CfasFilter from "@/components/CfasFilter/CfasFilter";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import CfaPanel from "@/components/CfasFilter/CfasPanel";
import { NAVIGATION_PAGES } from "@/common/constants/navigationPages";
import useFetchOrganismeInfo from "@/hooks/useFetchOrganismeInfo";
import { useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";
import OrganismeViewContent from "./OrganismeViewContent";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Head from "next/head";

const IndicateursVueOrganismePage = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();

  const { data: infosCfa, loading, error } = useFetchOrganismeInfo(filtersContext?.state?.cfa?.uai_etablissement);

  const currentOrganisme = filtersContext.state.cfa;
  const organismeFilterLabel = userLoggedAsReseau
    ? `Sélectionner un organisme du réseau ${filtersContext.state.reseau?.nom}`
    : "Sélectionner un organisme";

  return (
    <Page>
      <Head>
        <title>{NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.title}</title>
      </Head>
      <Section paddingY="3w">
        <Breadcrumb
          pages={[NAVIGATION_PAGES.MonTableauDeBord, NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme]}
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
