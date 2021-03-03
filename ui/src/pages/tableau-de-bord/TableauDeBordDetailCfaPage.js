import { Box, Divider, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Page, PageContent, PageHeader } from "../../common/components";
import { usePostFetch } from "../../common/hooks/useFetch";
import EnSavoirPlusModal from "./EnSavoirPlusModal";
import Filters from "./Filters";
import InfoCfaSection from "./sections/cfa/InfoCfaSection";
import RepartionCfaNiveauAnneesSection from "./sections/cfa/RepartionCfaNiveauAnneesSection";
import EffectifsSection from "./sections/EffectifsSection";

const TableauDeBordPage = ({ match }) => {
  const siret = match.params.siret;

  const [dataCfa, loadingCfa, errorCfa] = usePostFetch("/api/dashboard/cfa/", { siret: siret });

  // TODO : Intégration Effectif section
  // const [dataEffectifs, loadingEffectif, errorEffectif] = usePostFetch("/api/dashboard/effectifs", {
  //   beginDate: "2021-01-15T00:00:00.000Z",
  //   endDate: "2021-01-30T00:00:00.000Z",
  //   filters: { siret_etablissement: siret, siret_etablissement_valid: true },
  // });

  return (
    <Page>
      <PageHeader title="Tableau de bord de l'apprentissage">
        <Text color="grey.800" fontWeight="bold" textAlign="center" marginTop="1w">
          <span>Les indices affichés concernent 858 centres de formation</span>
          &nbsp;
          <EnSavoirPlusModal />
        </Text>
        <Filters />
      </PageHeader>
      <PageContent>
        <Stack spacing="32px">
          <Box>
            <InfoCfaSection infosCfa={dataCfa} loading={loadingCfa} error={errorCfa} />
          </Box>
          <Divider orientation="horizontal" />
          <Box>
            <EffectifsSection />
          </Box>
          <Box>
            <RepartionCfaNiveauAnneesSection />
          </Box>
        </Stack>
      </PageContent>
    </Page>
  );
};

TableauDeBordPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      siret: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};
export default TableauDeBordPage;
