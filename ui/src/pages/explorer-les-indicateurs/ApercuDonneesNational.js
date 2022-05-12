import { Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { EffectifCard, Section } from "../../common/components";
import { indicateursNational } from "../../common/constants/indicateursNational";
import { pluralize } from "../../common/utils/stringUtils";

const ApercuDonneesNational = () => {
  return (
    <Section paddingY="4w" color="grey.800" marginBottom="15w">
      <Heading as="h2" fontSize="gamma">
        Aperçu des données au national le {indicateursNational.dateCalcul}
      </Heading>
      <HStack spacing="1w" paddingY="2w">
        <EffectifCard
          count={indicateursNational.nbOrganismeFormation.count}
          label={pluralize("organismes de formation", indicateursNational.nbOrganismeFormation.count)}
          tooltipLabel="Nombre d’organismes de formation qui transmettent leurs données au Tableau de bord de l’apprentissage. Un organisme est identifié par une UAI utilisant 1 ou plusieurs numéro(s) SIRET."
          iconClassName="ri-home-6-fill"
          accentColor="#417DC4"
        />
        <EffectifCard
          count={indicateursNational.nbApprentis.count}
          label={`${pluralize("apprenti", indicateursNational.nbApprentis.count)}`}
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
          count={indicateursNational.nbInscritsSansContrats.count}
          label={`${pluralize("inscrit", indicateursNational.nbInscritsSansContrats.count)} sans contrat`}
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
          count={indicateursNational.nbRupturants.count}
          label={pluralize("rupturant", indicateursNational.nbRupturants.count)}
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
          count={indicateursNational.nbAbandons.count}
          label={pluralize("abandon", indicateursNational.nbAbandons.count)}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants ou d’apprentis qui ont définitivement quitté le centre de formation</b> à la date
              affichée. Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation.
            </div>
          }
          iconClassName="ri-user-4-fill"
          accentColor="#F99389"
        />
      </HStack>
    </Section>
  );
};

export default ApercuDonneesNational;
