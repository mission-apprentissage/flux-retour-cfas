import { Box, Center, Divider, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Page, PageContent, PageHeader } from "../../common/components";
import { useFetch, usePostFetch } from "../../common/hooks/useFetch";
import EnSavoirPlusModal from "./EnSavoirPlusModal";
import Filters from "./Filters";
import InfoCfaSection from "./sections/cfa/InfoCfaSection";
import RepartionCfaNiveauAnneesSection from "./sections/cfa/RepartionCfaNiveauAnneesSection";
import EffectifsSection from "./sections/EffectifsSection";
import withEffectifsData from "./withEffectifsData";

const TableauDeBordDetailCfaPage = ({ match, effectifs, fetchEffectifs, loading, error }) => {
  const siret = match.params.siret;
  const [dataCfa, loadingCfa, errorCfa] = usePostFetch("/api/dashboard/cfa/", { siret: siret });
  const [dataStats, loadingStats, errorStats] = useFetch("/api/dashboard/etablissements-stats/");

  const errorPanel = () => (
    <Center h="100px" p={4} background="orangesoft.200">
      <HStack fontSize="gamma">
        <i className="ri-error-warning-fill"></i>
        <Text>Erreur - merci de contacter un administrateur</Text>
      </HStack>
    </Center>
  );

  const noDataPanel = () => (
    <Center h="100px" p={4} background="orangesoft.200">
      <HStack fontSize="gamma">
        <i className="ri-error-warning-fill"></i>
        <Text>Aucune information disponible, merci de filtrer sur une localisation</Text>
      </HStack>
    </Center>
  );

  return (
    <Page>
      <PageHeader title="Tableau de bord de l'apprentissage">
        {dataStats && (
          <Text color="grey.800" fontWeight="bold" textAlign="center" marginTop="1w">
            <span>Les indices affichés concernent 858 centres de formation</span>
            &nbsp;
            <EnSavoirPlusModal />
          </Text>
        )}
        {loadingStats && <Skeleton />}
        {errorStats && errorPanel()}
        <Filters onChange={fetchEffectifs} />
      </PageHeader>
      <PageContent>
        <Stack spacing="32px">
          <Box>
            <InfoCfaSection infosCfa={dataCfa} loading={loadingCfa} error={errorCfa} />
          </Box>
          <Divider orientation="horizontal" />
          <Box>
            {effectifs && <EffectifsSection effectifs={effectifs} />}
            {!effectifs && !loading && !error && noDataPanel()}
            {loading && <Skeleton flex="2" h="100px" p={4} />}
            {error && errorPanel()}
          </Box>
          <Box>
            <RepartionCfaNiveauAnneesSection />
          </Box>
        </Stack>
      </PageContent>
    </Page>
  );
};

TableauDeBordDetailCfaPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      siret: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
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
  loading: PropTypes.bool,
  error: PropTypes.object,
  fetchEffectifs: PropTypes.func.isRequired,
};

export default withEffectifsData(TableauDeBordDetailCfaPage);
