import { Grid, Skeleton } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import EffectifCard from "./EffectifCard/EffectifCard";

import { isDateFuture } from "@/common/utils/dateUtils";
import { pluralize } from "@/common/utils/stringUtils";

const GRID_TEMPLATE_COLUMNS = ["", "", "repeat(3, 2fr)", "repeat(5, 1fr)"];

const IndicateursGridStack = ({
  effectifs,
  effectifsDate,
  organismesCount = 0,
  loading,
  showOrganismesCount = true,
}) => {
  if (loading) {
    return (
      <Grid gridGap="2w" gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
        {showOrganismesCount && <Skeleton height="136px" startColor="grey.300" endColor="galt" />}
        <Skeleton height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton height="136px" startColor="grey.300" endColor="galt" />
        <Skeleton height="136px" startColor="grey.300" endColor="galt" />
      </Grid>
    );
  }

  if (effectifs && !loading) {
    const shouldWarnAboutDateAvailability = isDateFuture(effectifsDate);
    const infoTextAboutDateAvailability = (
      <span>
        cet indice ne peut être calculé sur <br /> la période sélectionnée
      </span>
    );

    return (
      <Grid gridGap="1w" gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
        {showOrganismesCount && (
          <EffectifCard
            count={organismesCount}
            label="organismes de formation"
            tooltipLabel={
              <div>
                Nombre d’organismes de formation qui transmettent leurs données au tableau de bord de l’apprentissage.
                Un organisme est identifié par un numéro UAI et un numéro SIRET.
              </div>
            }
            iconClassName="ri-home-6-fill"
            accentColor="#417DC4"
          />
        )}
        <EffectifCard
          count={effectifs.apprentis}
          label={pluralize("apprenti", effectifs.apprentis)}
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
          count={effectifs.inscritsSansContrat}
          label={`${pluralize("inscrit", effectifs.inscritsSansContrat)} sans contrat`}
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
          count={effectifs.rupturants}
          label={pluralize("rupturant", effectifs.rupturants)}
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
          count={effectifs.abandons}
          hideCount={shouldWarnAboutDateAvailability}
          infoText={shouldWarnAboutDateAvailability ? infoTextAboutDateAvailability : ""}
          label={pluralize("abandon", effectifs.abandons)}
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
  // valeur par défaut au cas où
  return <></>;
};

IndicateursGridStack.propTypes = {
  loading: PropTypes.bool.isRequired,
  showOrganismesCount: PropTypes.bool,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    inscritsSansContrat: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
    rupturants: PropTypes.number.isRequired,
  }),
  effectifsDate: PropTypes.instanceOf(Date),
  organismesCount: PropTypes.number,
};

export default IndicateursGridStack;
