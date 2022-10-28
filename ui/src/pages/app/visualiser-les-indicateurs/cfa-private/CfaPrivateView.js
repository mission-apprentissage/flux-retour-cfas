import { Box, Flex, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages.js";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import useFetchCfaInfo from "../../../../common/hooks/useFetchCfaInfo";
import { FranceLocalization } from "../../../../theme/components/icons/FranceLocalization.js";
import { useFiltersContext } from "../FiltersContext";
import {
  CfaInformationSection,
  IndicateursAndRepartionCfaNiveauAnneesSection,
  MultiSiretDetailInformationSection,
  RepartitionEffectifsParSiretSection,
} from "../par-organisme/sections";

const CfaPrivateView = ({ cfaUai }) => {
  const [effectifs, effectifsLoading] = useEffectifs();
  const { data: infosCfa, loading: infosCfaLoading, error: infosCfaError } = useFetchCfaInfo(cfaUai);
  const { state: filters } = useFiltersContext();
  const hasMultipleSirets = infosCfa?.sousEtablissements?.length > 1;
  const sirets = infosCfa?.sousEtablissements?.map((item) => item.siret_etablissement);
  const displaySousEtablissementDetail = filters?.sousEtablissement !== null;

  return (
    <Page>
      <Section withShadow backgroundColor="galt" paddingY="4w" marginBottom="4w">
        <Flex alignItems="center" gap="2">
          <Box>
            <Stack spacing="3w">
              <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.Cfa]} />
              <CfaInformationSection
                marginTop="4w"
                infosCfa={infosCfa}
                loading={infosCfaLoading}
                error={infosCfaError}
              />
            </Stack>
          </Box>
          <Box padding="20">
            <FranceLocalization width="140px" height="140px" marginX="auto" marginY="auto" />
          </Box>
        </Flex>
      </Section>

      {/* Filtre sur le siret pour la vue détail d'un sous établissement rattaché à un établissement avec plusieurs sirets */}
      {displaySousEtablissementDetail && <MultiSiretDetailInformationSection sirets={sirets} />}

      {/* Répartition par Siret pour un établissement multi-siret */}
      {!displaySousEtablissementDetail && hasMultipleSirets && (
        <RepartitionEffectifsParSiretSection namedDataDownloadMode={true} filters={filters} />
      )}

      {/* Vue Globale & Repartition pour un établissement sans sirets multiple ou dans la vue détail d'un sous établissement */}
      {(displaySousEtablissementDetail || !hasMultipleSirets) && (
        <IndicateursAndRepartionCfaNiveauAnneesSection
          filters={filters}
          effectifs={effectifs}
          loading={effectifsLoading}
          hasMultipleSirets={hasMultipleSirets}
          namedDataDownloadMode={true}
        />
      )}
    </Page>
  );
};

CfaPrivateView.propTypes = {
  cfaUai: PropTypes.string.isRequired,
};

export default CfaPrivateView;
