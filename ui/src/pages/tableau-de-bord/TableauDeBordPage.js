import { Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Page, PageContent, PageHeader, PageSkeleton } from "../../common/components";
import EnSavoirPlusModal from "./EnSavoirPlusModal";
import Filters from "./Filters";
import EffectifsSection from "./sections/EffectifsSection";
import withEffectifsData from "./withEffectifsData";

const TableauDeBordPage = ({ effectifs, fetchEffectifs, loading, error }) => {
  let content = null;
  if (effectifs) content = <EffectifsSection effectifs={effectifs} />;
  if (error) content = <p>Erreur lors du chargement du tableau de bord</p>;
  if (loading) content = <PageSkeleton />;

  return (
    <Page>
      <PageHeader title="Tableau de bord de l'apprentissage">
        <Text color="grey.800" fontWeight="bold" textAlign="center" marginTop="1w">
          <span>Les indices affichés concernent 858 centres de formation</span>
          &nbsp;
          <EnSavoirPlusModal />
        </Text>
        <Filters onChange={fetchEffectifs} />
      </PageHeader>
      <PageContent>{content}</PageContent>
    </Page>
  );
};

TableauDeBordPage.propTypes = {
  effectifs: PropTypes.shape({
    apprentis: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
    inscrits: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
    abandons: PropTypes.shape({
      count: PropTypes.number.isRequired,
      evolution: PropTypes.number,
    }).isRequired,
  }),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  fetchEffectifs: PropTypes.func.isRequired,
};

export default withEffectifsData(TableauDeBordPage);
