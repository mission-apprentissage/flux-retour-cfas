import { Text } from "@chakra-ui/react";
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

  return (
    <Page>
      <PageHeader title="Tableau de bord de l'apprentissage">
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
