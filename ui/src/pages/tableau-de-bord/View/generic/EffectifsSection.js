import { Heading, HStack, Skeleton } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { EffectifCard, Section } from "../../../../common/components";
import PeriodeFilter from "../../Filters/periode/PeriodeFilter";
import { useFiltersContext } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";

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
          label="apprentis"
          tooltipLabel="Nombre d’apprenants en contrat d'apprentissage au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
        <EffectifCard
          count={effectifs.jeunesSansContrat.count}
          label="jeunes sans contrat"
          tooltipLabel="Nombre d’apprenants ayant démarré une formation en apprentissage sans avoir signé de contrat et toujours dans cette situation au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
        <EffectifCard
          count={effectifs.rupturants.count}
          label="rupturants"
          tooltipLabel="Nombre d’apprenants sans contrat après une rupture au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
        />
        <EffectifCard
          count={effectifs.abandons.count}
          label="abandons"
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
