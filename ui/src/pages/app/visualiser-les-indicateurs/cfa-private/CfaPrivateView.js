import { Box, Flex, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";
import PropTypes from "prop-types";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../../../common/components";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages.js";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import useFetchCfaInfo from "../../../../common/hooks/useFetchCfaInfo";
import { formatDateMonthYear } from "../../../../common/utils/dateUtils.js";
import { FranceLocalization } from "../../../../theme/components/icons/FranceLocalization.js";
import { useFiltersContext } from "../FiltersContext";
import IndicateursGridStack from "../IndicateursGridStack.js";
import {
  CfaInformationSection,
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
  const date = startOfHour(new Date());

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
        <RepartitionEffectifsParSiretSection filters={filters} />
      )}

      {/* Vue Globale & Repartition pour un établissement sans sirets multiple ou dans la vue détail d'un sous établissement */}
      {(displaySousEtablissementDetail || !hasMultipleSirets) && (
        <Section paddingY="4w" marginBottom="4w">
          <Stack spacing="3w">
            <HStack alignItems="flex-end">
              <Heading as="h2" fontSize="alpha">
                Aperçu des données
              </Heading>
              <Text color="grey.800" fontSize="zeta">
                (Vos données en {formatDateMonthYear(date)})
              </Text>
            </HStack>

            <IndicateursGridStack
              effectifs={effectifs}
              loading={effectifsLoading}
              showOrganismesCount={false}
              effectifsDate={filters.date}
            />
          </Stack>
        </Section>
      )}
    </Page>
  );
};

CfaPrivateView.propTypes = {
  cfaUai: PropTypes.string.isRequired,
};

export default CfaPrivateView;
