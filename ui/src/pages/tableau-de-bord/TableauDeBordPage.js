import { Box, Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Page, PageContent, PageHeader } from "../../common/components";
import { useFetch } from "../../common/hooks/useFetch";
import EnSavoirPlusModal from "./EnSavoirPlusModal";
import Filters from "./Filters";
import { effectifsPropType, filtersPropType } from "./propTypes";
import View from "./View";
import withEffectifsData from "./withEffectifsData";

const TableauDeBordPage = ({ effectifs, filters, setFilters, loading, error }) => {
  const [dataStats] = useFetch("/api/dashboard/etablissements-stats/");

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
        <Text color="grey.800" fontWeight="bold" textAlign="center" marginTop="1w">
          <span>Les indices affichés concernent {dataStats?.nbEtablissements} centres de formation</span>
          &nbsp;
          <EnSavoirPlusModal />
        </Text>
        <Filters setFilters={setFilters} filters={filters} />
      </PageHeader>
      <PageContent>
        <View effectifs={effectifs} filters={filters} loading={loading} error={error} />
      </PageContent>
    </Page>
  );
};

TableauDeBordPage.propTypes = {
  effectifs: effectifsPropType,
  filters: filtersPropType.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  setFilters: PropTypes.func.isRequired,
};

export default withEffectifsData(TableauDeBordPage);
