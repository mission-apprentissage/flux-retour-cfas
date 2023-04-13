import { Box, Heading, HStack } from "@chakra-ui/react";
import React from "react";
import Head from "next/head";

import FormationFilter from "@/components/FormationFilter/FormationFilter";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import TerritoireFilter from "@/components/TerritoireFilter/TerritoireFilter";
import useEffectifs from "@/hooks/useEffectifs";
import { useFiltersContext } from "../FiltersContext";
import SwitchViewButton from "../SwitchViewButton";
import IndicateursAndRepartitionEffectifsTerritoire from "./IndicateursAndRepartitionEffectifsTerritoire";

const IndicateursVueTerritoirePage = () => {
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();
  const title = "Vue territoriale";

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
        <HStack spacing="4w">
          <TerritoireFilter
            onDepartementChange={filtersContext.setters.setDepartement}
            onRegionChange={filtersContext.setters.setRegion}
            onTerritoireReset={filtersContext.setters.resetTerritoire}
            filters={filtersContext.state}
          />
          <HStack spacing="3v">
            <Box color="grey.800">Filtrer :</Box>
            <FormationFilter
              filters={filtersContext.state}
              onFormationChange={filtersContext.setters.setFormation}
              variant="secondary"
            />
          </HStack>
        </HStack>
      </Section>
      <IndicateursAndRepartitionEffectifsTerritoire
        filters={filtersContext.state}
        effectifs={effectifs}
        loading={loading}
      />
    </Page>
  );
};

export default IndicateursVueTerritoirePage;
