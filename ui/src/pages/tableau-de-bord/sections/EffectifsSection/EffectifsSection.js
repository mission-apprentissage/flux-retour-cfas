import { Heading, HStack, Skeleton, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { EffectifCard, Section } from "../../../../common/components";
import { isDateFuture } from "../../../../common/utils/dateUtils";
import { pluralize } from "../../../../common/utils/stringUtils";
import { InfoLine } from "../../../../theme/components/icons";
import { useFiltersContext } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import PeriodeFilter from "./PeriodeFilter";

const EffectifsSection = ({ effectifs, loading }) => {
  const filtersContext = useFiltersContext();
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
          label={pluralize("apprenti", effectifs.apprentis.count)}
          tooltipLabel="Nombre d’apprenants en contrat d'apprentissage au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
        <EffectifCard
          count={effectifs.inscritsSansContrat.count}
          label={`${pluralize("inscrit", effectifs.inscritsSansContrat.count)} sans contrat`}
          tooltipLabel="Nombre d’apprenants ayant démarré une formation en apprentissage sans avoir signé de contrat et toujours dans cette situation au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
        <EffectifCard
          count={effectifs.rupturants.count}
          label={pluralize("rupturant", effectifs.rupturants.count)}
          validPeriod={!isDateFuture(filtersContext.state.date)}
          tooltipLabel="Nombre d’apprenants sans contrat après une rupture au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
        <EffectifCard
          count={effectifs.abandons.count}
          validPeriod={!isDateFuture(filtersContext.state.date)}
          label={pluralize("abandon", effectifs.abandons.count)}
          tooltipLabel="Nombre d’apprenants ou d’apprentis qui sont définitivement sortis de la formation au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
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
      {content}
    </Section>
  );
};

EffectifsSection.propTypes = {
  loading: PropTypes.bool.isRequired,
  effectifs: effectifsPropType,
};

export default EffectifsSection;
