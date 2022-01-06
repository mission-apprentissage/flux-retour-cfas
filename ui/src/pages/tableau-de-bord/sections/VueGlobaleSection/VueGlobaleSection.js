import { Heading, HStack, Skeleton, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { EffectifCard, Section } from "../../../../common/components";
import { isDateFuture } from "../../../../common/utils/dateUtils";
import { pluralize } from "../../../../common/utils/stringUtils";
import { InfoLine } from "../../../../theme/components/icons";
import { useFiltersContext } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import DateFilter from "./DateFilter";
import OrganismesCountCard from "./OrganismesCountCard";

const VueGlobaleSection = ({ effectifs, loading, showOrganismesCount = false }) => {
  const filtersContext = useFiltersContext();
  let content = null;
  if (loading) {
    content = (
      <HStack spacing="2w">
        {showOrganismesCount && <Skeleton width="16rem" height="136px" startColor="grey.300" endColor="galt" />}
        <Skeleton width="16rem" height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton width="16rem" height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton width="16rem" height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton width="16rem" height="136px" startColor="grey.300" endColor="galt" />
      </HStack>
    );
  }

  if (effectifs && !loading) {
    const shouldWarnAboutDateAvailability = isDateFuture(filtersContext.state.date);
    const infoTextAboutDateAvailability = (
      <span>
        cet indice ne peut être calculé sur <br /> la période sélectionnée
      </span>
    );

    content = (
      <HStack spacing="2w" alignItems="stretch">
        {showOrganismesCount && <OrganismesCountCard />}
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
          tooltipLabel="Nombre d’apprenants sans contrat après une rupture au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
          warningText="correctif en cours"
        />
        <EffectifCard
          count={effectifs.abandons.count}
          hideCount={shouldWarnAboutDateAvailability}
          label={pluralize("abandon", effectifs.abandons.count)}
          tooltipLabel="Nombre d’apprenants ou d’apprentis qui sont définitivement sortis de la formation au dernier jour du mois (ou J-1 si mois en cours). Cet indice est déduit des saisies effectuées dans Yparéo et/ou Gesti."
          infoText={shouldWarnAboutDateAvailability ? infoTextAboutDateAvailability : ""}
        />
      </HStack>
    );
  }

  return (
    <Section paddingY="4w">
      <HStack marginBottom="2w">
        <Heading as="h2" variant="h2">
          Vue globale
        </Heading>

        <DateFilter value={filtersContext.state.date} onChange={filtersContext.setters.setDate} />
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

VueGlobaleSection.propTypes = {
  loading: PropTypes.bool.isRequired,
  showOrganismesCount: PropTypes.bool,
  effectifs: effectifsPropType,
};

export default VueGlobaleSection;
