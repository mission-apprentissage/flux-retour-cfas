import { Heading, HStack, Skeleton, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { EffectifCard, Section } from "../../../../common/components";
import { EFFECTIF_INDICATEURS } from "../../../../common/constants/effectifIndicateur";
import { isDateFuture } from "../../../../common/utils/dateUtils";
import { pluralize } from "../../../../common/utils/stringUtils";
import { InfoLine } from "../../../../theme/components/icons";
import { useFiltersContext } from "../../FiltersContext";
import { effectifsPropType } from "../../propTypes";
import DateFilter from "./DateFilter";
import OrganismesCountCard from "./OrganismesCountCard";

const VueGlobaleSection = ({ effectifs, loading, allowDownloadDataList = false, showOrganismesCount = false }) => {
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
          effectifIndicateur={allowDownloadDataList === true ? EFFECTIF_INDICATEURS.apprentis : null}
          tooltipLabel={
            <div>
              <b>Nombre d&apos;apprenants en contrat d&apos;apprentissage</b> au dernier jour du mois (ou J-1 si mois en
              cours). Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation. Il
              est affiné par la prise en compte des dates de début de contrat saisie.
            </div>
          }
          iconClassName="ri-user-4-fill"
          accentColor="#56C8B6"
        />
        <EffectifCard
          count={effectifs.inscritsSansContrat.count}
          label={`${pluralize("inscrit", effectifs.inscritsSansContrat.count)} sans contrat`}
          effectifIndicateur={allowDownloadDataList === true ? EFFECTIF_INDICATEURS.inscritsSansContrats : null}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants ayant démarré une formation en apprentissage sans avoir jamais signé de contrat</b>{" "}
              et toujours dans cette situation au dernier jour du mois (ou J-1 si mois en cours). Cet indicateur est
              déduit de plusieurs statuts transmis par les organismes de formation. Il est affiné par la prise en compte
              des dates d’enregistrement des inscriptions et de l’absence de dates de début de contrat.
            </div>
          }
          iconClassName="ri-user-4-fill"
          accentColor="#F3DC58"
        />
        <EffectifCard
          count={effectifs.rupturants.count}
          label={pluralize("rupturant", effectifs.rupturants.count)}
          effectifIndicateur={allowDownloadDataList === true ? EFFECTIF_INDICATEURS.rupturants : null}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants en recherche de contrat après une rupture</b> et toujours dans cette situation à la
              date affichée. Cet indicateur est déduit de plusieurs statuts transmis par les organismes de formation.
            </div>
          }
          iconClassName="ri-user-4-fill"
          accentColor="#FCC63A"
        />
        <EffectifCard
          count={effectifs.abandons.count}
          hideCount={shouldWarnAboutDateAvailability}
          effectifIndicateur={allowDownloadDataList === true ? EFFECTIF_INDICATEURS.abandons : null}
          label={pluralize("abandon", effectifs.abandons.count)}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants ou d’apprentis qui ont définitivement quitté le centre de formation</b> à la date
              affichée. Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation.
            </div>
          }
          infoText={shouldWarnAboutDateAvailability ? infoTextAboutDateAvailability : ""}
          iconClassName="ri-user-4-fill"
          accentColor="#F99389"
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
          label={
            <Text>
              La sélection du mois permet d&apos;afficher les effectifs au dernier jour du mois. <br />
              <br /> A noter : la période de référence pour l&apos;année scolaire court du 1er août au 31 juillet
            </Text>
          }
          aria-label="A tooltip"
          background="bluefrance"
          color="white"
          padding={5}
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
  allowDownloadDataList: PropTypes.bool,
  showOrganismesCount: PropTypes.bool,
  effectifs: effectifsPropType,
};

export default VueGlobaleSection;
