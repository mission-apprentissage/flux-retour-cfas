import { Box, Flex } from "@chakra-ui/react";
import React from "react";

import { Page, PageContent, PageHeader } from "../../common/components";
import EnSavoirPlusModal from "./EnSavoirPlusModal";
import Filters from "./Filters";
import { FiltersProvider } from "./FiltersContext";
import useEffectifs from "./useEffectifs";
import View from "./View";

const TableauDeBordPage = () => {
  const [effectifs, loading, error] = useEffectifs();
  const pageTitle = (
    <Flex justifyContent="center" alignItems="center">
      <span>Tableau de bord de l&apos;apprentissage</span>
      &nbsp;
      <Box
        as="legend"
        paddingX="1w"
        paddingY="1v"
        fontSize="zeta"
        backgroundColor="bluefrance"
        color="white"
        borderRadius="4px"
      >
        beta
      </Box>
    </Flex>
  );

  return (
    <Page>
      <PageHeader title={pageTitle}>
        <EnSavoirPlusModal />
        <Filters />
      </PageHeader>
      <PageContent>
        <View effectifs={effectifs} loading={loading} error={error} />
      </PageContent>
    </Page>
  );
};

const TableauDeBordPageContainer = () => {
  return (
    <FiltersProvider>
      <TableauDeBordPage />
    </FiltersProvider>
  );
};

export default TableauDeBordPageContainer;
