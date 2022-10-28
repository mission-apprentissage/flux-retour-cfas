import { Box, Circle, Flex, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";
import PropTypes from "prop-types";
import React from "react";
import { NavLink } from "react-router-dom";

import { BreadcrumbNav, Page, Section } from "../../../../common/components";
import SituationOrganisme from "../../../../common/components/SituationOrganisme/SituationOrganisme.js";
import { NAVIGATION_PAGES } from "../../../../common/constants/navigationPages.js";
import useEffectifs from "../../../../common/hooks/useEffectifs";
import useFetchCfaInfo from "../../../../common/hooks/useFetchCfaInfo";
import { formatDateMonthYear } from "../../../../common/utils/dateUtils.js";
import { FranceLocalization } from "../../../../theme/components/icons/FranceLocalization.js";
import { RightLine } from "../../../../theme/components/icons/RightLine.js";
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
        <Section paddingY="2w">
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

      {/* Situation organisme & bouton visualiser SIFA  */}
      <Section marginBottom="4w" marginTop="4w">
        <HStack spacing="0.5w" alignItems="flex-start">
          <SituationOrganisme uai={infosCfa?.uai} adresse={infosCfa?.referentielAdresse} />
          <Circle
            size="40px"
            left="25px"
            bottom="20px"
            position="relative"
            borderColor="#DDDDDD"
            backgroundColor="white"
            borderWidth="1px"
            color="black"
          >
            <Box as="i" className="ri-eye-line" fontSize="gamma" />
          </Circle>
          <Box as={NavLink} to="#" padding="4w" borderColor="#DDDDDD" borderWidth="1px">
            <Stack spacing="2w">
              <Heading color="black" fontSize="gamma" flex="1">
                Visualiser mes données SIFA
              </Heading>
              <Flex justifyContent="right">
                <RightLine color="bluefrance" marginBottom="1w" />
              </Flex>
            </Stack>
          </Box>
        </HStack>
      </Section>
    </Page>
  );
};

CfaPrivateView.propTypes = {
  cfaUai: PropTypes.string.isRequired,
};

export default CfaPrivateView;
