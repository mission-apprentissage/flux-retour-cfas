import { Box, Flex, Heading, HStack } from "@chakra-ui/react";
import Head from "next/head";
import PropTypes from "prop-types";
import React from "react";

import CfasFilter from "@/components/CfasFilter/CfasFilter";
import CfaPanel from "@/components/CfasFilter/CfasPanel";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import useFetchOrganismeInfo from "@/hooks/useFetchOrganismeInfo";

import { useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";

import OrganismeViewContent from "./OrganismeViewContent";

const IndicateursVueOrganismePage = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();
  const title = "Vue par organisme de formation";
  const { data: infosCfa, loading, error } = useFetchOrganismeInfo(filtersContext?.state?.cfa?.uai_etablissement);

  const currentOrganisme = filtersContext.state.cfa;
  const organismeFilterLabel = userLoggedAsReseau
    ? `Sélectionner un organisme du réseau ${filtersContext.state.reseau?.nom}`
    : "Sélectionner un organisme";

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section paddingY="3w">
        <HStack marginTop="4w" marginBottom="3v" spacing="2w">
          <Heading as="h1">{title}</Heading>
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
