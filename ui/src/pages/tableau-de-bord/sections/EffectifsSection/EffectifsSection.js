import { Box, Flex, Heading, HStack, Skeleton, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Alert, EffectifCard, Section } from "../../../../common/components";
import { isDateFuture } from "../../../../common/utils/dateUtils";
import { Error, InfoLine } from "../../../../theme/components/icons";
import { useFiltersContext } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import PeriodeFilter from "./PeriodeFilter";

const EffectifsSection = ({ effectifs, loading }) => {
  const filtersContext = useFiltersContext();
  const shouldHideEffectifs = isDateFuture(filtersContext.state.date);
  let content = null;
  if (loading) {
    content = (
      <HStack spacing="2w">
        <Skeleton width="16rem" height="6rem" startColor="grey.300" endColor="galt" />
        <Skeleton width="16rem" height="6rem" startColor="grey.300" endColor="galt" />
        <Skeleton width="16rem" height="6rem" startColor="grey.300" endColor="galt" />
        <Skeleton width="16rem" height="6rem" startColor="grey.300" endColor="galt" />
      </HStack>
    );
  }

  if (effectifs && !loading) {
    content = (
      <HStack spacing="2w">
        <EffectifCard
          count={effectifs.apprentis.count}
          label={effectifs.apprentis.count > 1 ? "apprentis" : "apprenti"}
          tooltipLabel="Nombre d’apprenants en contrat d'apprentissage au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
        <EffectifCard
          count={effectifs.inscritsSansContrat.count}
          label={effectifs.inscritsSansContrat.count > 1 ? "inscrits sans contrat" : "inscrit sans contrat"}
          tooltipLabel="Nombre d’apprenants ayant démarré une formation en apprentissage sans avoir signé de contrat et toujours dans cette situation au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
        {shouldHideEffectifs === false && (
          <>
            <EffectifCard
              count={effectifs.rupturants.count}
              label={effectifs.rupturants.count > 1 ? "rupturants" : "rupturant"}
              tooltipLabel="Nombre d’apprenants sans contrat après une rupture au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
            />

            <EffectifCard
              count={effectifs.abandons.count}
              label={effectifs.abandons.count > 1 ? "abandons" : "abandon"}
              tooltipLabel="Nombre d’apprenants ou d’apprentis qui sont définitivement sortis de la formation au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
            />
          </>
        )}
        {shouldHideEffectifs === true && (
          <Box
            as="article"
            backgroundColor="galt"
            fontSize="gamma"
            padding="3w"
            color="grey.800"
            height="9rem"
            minWidth="18rem"
          >
            <Flex>
              <Text>
                {effectifs.abandons.count} {effectifs.abandons.count > 1 ? "abandons" : "abandon"}
              </Text>
              <Tooltip
                bg="#F9F8F6"
                label={
                  <Text>
                    La sélection du mois permet d&apos;afficher les effectifs au dernier jour du mois. <br />
                    Vous pouvez consulter les effectifs d&apos;apprentis et d&apos;inscrits dans les mois à venir.
                    <br /> A noter : l&apos;année scolaire court du 1er août au 31 juillet
                  </Text>
                }
                aria-label="A tooltip"
                background="bluefrance"
                color="white"
                p={5}
              >
                <Text as="span">
                  <InfoLine h="14px" w="14px" color="grey.500" ml={1} mb={1} />
                </Text>
              </Tooltip>
              <Error h="24px" w="24px" flex="1" color="bluefrance" />
            </Flex>
            <br />
            <Text color="grey.700" fontWeight="700" fontSize="14px">
              cet indice ne peut être calculé sur <br />
              la période sélectionnée
            </Text>
          </Box>
        )}
      </HStack>
    );
  }

  return (
    <Section paddingY="4w">
      <HStack marginBottom="2w">
        <Heading as="h2" variant="h2">
          Effectifs
        </Heading>
        <PeriodeFilter value={filtersContext.state.date} onChange={filtersContext.setters.setDate} />
        <Tooltip
          bg="#F9F8F6"
          label={
            <Text>
              La sélection du mois permet d&apos;afficher les effectifs au dernier jour du mois. <br />
              Vous pouvez consulter les effectifs d&apos;apprentis et d&apos;inscrits dans les mois à venir.
              <br /> A noter : l&apos;année scolaire court du 1er août au 31 juillet
            </Text>
          }
          aria-label="A tooltip"
          background="bluefrance"
          color="white"
          p={5}
        >
          <Text as="span">
            <InfoLine h="14px" w="14px" color="grey.500" ml={1} mb={1} />
          </Text>
        </Tooltip>
      </HStack>

      <Section paddingX="-5w" marginBottom="4w">
        <Alert>
          La collecte des effectifs 2021-2022 est en cours ce qui peut expliquer pour certains organismes des
          informations incomplètes. Les chiffres seront disponibles progressivement d’ici début septembre. Nous vous
          remercions de votre compréhension.
        </Alert>
      </Section>
      {content}
    </Section>
  );
};

EffectifsSection.propTypes = {
  loading: PropTypes.bool.isRequired,
  effectifs: effectifsPropType,
};

export default EffectifsSection;
