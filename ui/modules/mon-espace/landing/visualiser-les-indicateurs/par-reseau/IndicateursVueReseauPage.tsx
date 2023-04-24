import { Box, Heading, HStack, Text } from "@chakra-ui/react";
import Head from "next/head";
import PropTypes from "prop-types";
import React from "react";

import FormationFilter from "@/components/FormationFilter/FormationFilter";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import TerritoireFilter from "@/components/TerritoireFilter/TerritoireFilter";

import { useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";

import ReseauSelect from "./ReseauSelect/ReseauSelect";
import ReseauSelectPanel from "./ReseauSelect/ReseauSelectPanel";
import ReseauViewContent from "./ReseauViewContent";

const IndicateursVueReseauPage = ({ userLoggedAsReseau = false }) => {
  const filtersContext = useFiltersContext();
  const title = "Vue par réseau";
  const currentReseau = filtersContext.state.reseau;

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
        {currentReseau ? (
          <HStack spacing="4w">
            {userLoggedAsReseau ? (
              <Text fontWeight="bold" fontSize="gamma">
                Réseau {currentReseau.nom}
              </Text>
            ) : (
              <ReseauSelect value={currentReseau} onReseauChange={filtersContext.setters.setReseau} />
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
        ) : (
          <Box marginY="3w" paddingX="8w" paddingY="6w" border="1px solid" borderColor="#E5E5E5">
            <ReseauSelectPanel onReseauClick={filtersContext.setters.setReseau} />
          </Box>
        )}
      </Section>
      {Boolean(currentReseau) && <ReseauViewContent userLoggedAsReseau={userLoggedAsReseau} />}
    </Page>
  );
};

IndicateursVueReseauPage.propTypes = {
  userLoggedAsReseau: PropTypes.bool,
};

export default IndicateursVueReseauPage;
