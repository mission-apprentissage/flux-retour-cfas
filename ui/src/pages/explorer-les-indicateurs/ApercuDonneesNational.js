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
          tooltipLabel="texte à rédiger"
          iconClassName="ri-home-6-fill"
          accentColor="#417DC4"
        />
        <EffectifCard
          count={indicateursNational.nbApprentis.count}
          label={`${pluralize("apprenti", indicateursNational.nbApprentis.count)}`}
          tooltipLabel="Nombre d’apprenants en contrat d'apprentissage au dernier jour du mois (ou J-1 si mois en cours). Cet indice est basé sur la date de début de contrat saisie par le CFA."
          iconClassName="ri-user-4-fill"
          accentColor="#56C8B6"
        />
        <EffectifCard
          count={indicateursNational.nbInscritsSansContrats.count}
          label={`${pluralize("inscrit", indicateursNational.nbInscritsSansContrats.count)} sans contrat`}
          tooltipLabel="Nombre d’apprenants ayant démarré une formation en apprentissage sans avoir signé de contrat et toujours dans cette situation à la date affichée. Cet indice est basé sur la date d'enregistrement de l'inscription et l'absence de date de début de contrat."
          iconClassName="ri-user-4-fill"
          accentColor="#F3DC58"
        />
        <EffectifCard
          count={indicateursNational.nbRupturants.count}
          label={pluralize("rupturant", indicateursNational.nbRupturants.count)}
          tooltipLabel="Nombre d’apprenants en recherche de contrat après une rupture et toujours dans cette situation à la date affichée . Cet indice est déduit des apprenants passant du statut apprenti au statut stagiaire de la formation professionnelle, selon les saisies effectuées par les CFA."
          iconClassName="ri-user-4-fill"
          accentColor="#FCC63A"
        />
        <EffectifCard
          count={indicateursNational.nbAbandons.count}
          label={pluralize("abandon", indicateursNational.nbAbandons.count)}
          tooltipLabel="Nombre d’apprenants ou d’apprentis qui sont définitivement sortis de la formation, à la date affichée. Cet indice est basé sur les dossiers cloturés, selon les saisies effectuées par les CFA."
          iconClassName="ri-user-4-fill"
          accentColor="#F99389"
        />
      </HStack>
    </Section>
  );
};

export default ApercuDonneesNational;
