import { Heading, HStack } from "@chakra-ui/react";
import React from "react";

import { EffectifCard, Section } from "../../common/components";
import { indicateurNational } from "../../common/constants/indicateurNational";
import { pluralize } from "../../common/utils/stringUtils";

const ApercuDonneesNational = () => {
  return (
    <Section paddingY="4w" color="grey.800" marginBottom="15w">
      <Heading as="h2" fontSize="gamma">
        Aperçu des données au national le 24 janvier 2022
      </Heading>
      <HStack spacing="1w" paddingY="2w">
        <EffectifCard
          count={indicateurNational.OrganismeFormation.count}
          label={pluralize("organismes de formation", indicateurNational.OrganismeFormation.count)}
          tooltipLabel="texte à rédiger"
        />
        <EffectifCard
          count={indicateurNational.Apprentis.count}
          label={`${pluralize("apprenti", indicateurNational.Apprentis.count)}`}
          tooltipLabel="Nombre d’apprenants en contrat d'apprentissage au dernier jour du mois (ou J-1 si mois en cours). Cet indice est basé sur la date de début de contrat saisie par le CFA."
        />
        <EffectifCard
          count={indicateurNational.InscritsSansContrats.count}
          label={`${pluralize("inscrit", indicateurNational.InscritsSansContrats.count)} sans contrat`}
          tooltipLabel="Nombre d’apprenants ayant démarré une formation en apprentissage sans avoir signé de contrat et toujours dans cette situation à la date affichée. Cet indice est basé sur la date d'enregistrement de l'inscription et l'absence de date de début de contrat."
        />
        <EffectifCard
          count={indicateurNational.Rupturants.count}
          label={pluralize("rupturant", indicateurNational.Rupturants.count)}
          tooltipLabel="Nombre d’apprenants en recherche de contrat après une rupture et toujours dans cette situation à la date affichée . Cet indice est déduit des apprenants passant du statut apprenti au statut stagiaire de la formation professionnelle, selon les saisies effectuées par les CFA."
        />
        <EffectifCard
          count={indicateurNational.Abandons.count}
          label={pluralize("abandon", indicateurNational.Abandons.count)}
          tooltipLabel="Nombre d’apprenants ou d’apprentis qui sont définitivement sortis de la formation, à la date affichée. Cet indice est basé sur les dossiers cloturés, selon les saisies effectuées par les CFA."
        />
      </HStack>
    </Section>
  );
};

export default ApercuDonneesNational;
