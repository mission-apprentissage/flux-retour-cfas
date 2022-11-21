import React from "react";
import Head from "next/head";
import { Box, Heading, HStack } from "@chakra-ui/react";
import { Page, Section } from "../../../components";
import { Breadcrumb } from "../../../components/Breadcrumb/Breadcrumb";
import { getAuthServerSideProps } from "../../../common/SSR/getAuthServerSideProps";
import { FiltersProvider, useFiltersContext } from "../../../modules/visualiser-les-indicateurs/FiltersContext";
import SwitchViewButton from "../../../modules/visualiser-les-indicateurs/SwitchViewButton";
import IndicateursAndRepartitionEffectifsTerritoire from "../../../modules/visualiser-les-indicateurs/par-territoire/IndicateursAndRepartitionEffectifsTerritoire";
import useEffectifs from "../../../hooks/useEffectifs";
import TerritoireFilter from "../../../modules/visualiser-les-indicateurs/components/TerritoireFilter/TerritoireFilter";
import FormationFilter from "../../../modules/visualiser-les-indicateurs/components/FormationFilter/FormationFilter";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function IndicateursVueTerritoire() {
  const title = "Vue territoriales";
  const filtersContext = useFiltersContext();
  const [effectifs, loading] = useEffectifs();

  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Section>
        <Breadcrumb
          pages={[
            // { title: "Mon espace", to: "/mon-espace/mon-tableau-de-bord" },
            { title: "Mon tableau de bord", to: "/mon-espace/mon-tableau-de-bord" },
            { title: title },
          ]}
        />
        <HStack mt={5} marginBottom="3v" spacing="2w">
          <Heading textStyle="h2" color="grey.800">
            {title}
          </Heading>
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
        <IndicateursAndRepartitionEffectifsTerritoire
          filters={filtersContext.state}
          effectifs={effectifs}
          loading={loading}
        />
      </Section>
    </Page>
  );
}

export default function IndicateursVueTerritoirePage() {
  return (
    <FiltersProvider>
      <IndicateursVueTerritoire />
    </FiltersProvider>
  );
}
