import { Grid, Skeleton, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { EffectifCard } from "../../../common/components";
import { EFFECTIF_INDICATEURS } from "../../../common/constants/effectifIndicateur";
import { isDateFuture } from "../../../common/utils/dateUtils";
import { pluralize } from "../../../common/utils/stringUtils";
import DateWithTooltipSelector from "./DateWithTooltipSelector";
import { useFiltersContext } from "./FiltersContext";
import OrganismesCountCard from "./OrganismesCountCard";

const IndicateursGridStack = ({ effectifs, loading, allowDownloadDataList = false, showOrganismesCount = true }) => {
  const filtersContext = useFiltersContext();
  let content = null;
  if (loading) {
    content = (
      <Grid gridGap="2w" gridTemplateColumns={["", "", "repeat(3, 2fr)", "repeat(5, 1fr)"]}>
        {showOrganismesCount && <Skeleton height="136px" startColor="grey.300" endColor="galt" />}
        <Skeleton height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton height="136px" startColor="grey.300" endColor="galt" />
      </Grid>
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
      <Grid gridGap="2w" gridTemplateColumns={["", "", "repeat(3, 2fr)", "repeat(5, 1fr)"]}>
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
          hideCount={shouldWarnAboutDateAvailability}
          infoText={shouldWarnAboutDateAvailability ? infoTextAboutDateAvailability : ""}
        />
        <EffectifCard
          count={effectifs.abandons.count}
          hideCount={shouldWarnAboutDateAvailability}
          infoText={shouldWarnAboutDateAvailability ? infoTextAboutDateAvailability : ""}
          effectifIndicateur={allowDownloadDataList === true ? EFFECTIF_INDICATEURS.abandons : null}
          label={pluralize("abandon", effectifs.abandons.count)}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants ou d’apprentis qui ont définitivement quitté le centre de formation</b> à la date
              affichée. Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation.
            </div>
          }
          iconClassName="ri-user-4-fill"
          accentColor="#F99389"
        />
      </Grid>
    );
  }

  return (
    <Stack>
      <DateWithTooltipSelector />
      {content}
    </Stack>
  );
};

IndicateursGridStack.propTypes = {
  loading: PropTypes.bool.isRequired,
  allowDownloadDataList: PropTypes.bool,
  showOrganismesCount: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    inscritsSansContrat: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    abandons: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
    rupturants: PropTypes.shape({
      count: PropTypes.number.isRequired,
    }).isRequired,
  }),
};

export default IndicateursGridStack;
