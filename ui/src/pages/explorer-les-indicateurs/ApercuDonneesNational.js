import { Heading, HStack, Spinner, Text } from "@chakra-ui/react";
import React from "react";

import { EffectifCard, Section } from "../../common/components";
import useFetchEffectifsNational from "../../common/hooks/useFetchEffectifsNational";
import { formatDateDayMonthYear } from "../../common/utils/dateUtils";
import { pluralize } from "../../common/utils/stringUtils";

const ApercuDonneesNational = () => {
  const { data: effectifsNational, loading: isEffectifsNationalLoading } = useFetchEffectifsNational();
  if (isEffectifsNationalLoading) return <Spinner />;
  const { date, totalOrganismes, apprentis, inscritsSansContrat, rupturants, abandons } = effectifsNational;
  console.log(effectifsNational);
  return (
    <Section paddingY="4w" color="grey.800" marginBottom="15w">
      <Heading as="h2" fontSize="gamma">
        Aperçu des données au national le {formatDateDayMonthYear(date)}
      </Heading>
      <Text marginTop="1w" fontStyle="italic" color="grey.800">
        Ces chiffres ne reflètent pas la réalité des effectifs de l’apprentissage. <br />
        En période estivale les organismes de formation constituent les effectifs pour la rentrée suivante.
      </Text>
      <HStack spacing="1w" paddingY="2w">
        <EffectifCard
          count={totalOrganismes}
          label={pluralize("organismes de formation", totalOrganismes)}
          tooltipLabel={
            <div>
              Nombre d’organismes de formation qui transmettent leurs données au Tableau de bord de l’apprentissage. Un
              organisme est identifié par une UAI utilisant 1 ou plusieurs numéro(s) SIRET.
            </div>
          }
          iconClassName="ri-home-6-fill"
          accentColor="#417DC4"
        />
        <EffectifCard
          count={apprentis}
          label={`${pluralize("apprenti", apprentis)}`}
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
          count={inscritsSansContrat}
          label={`${pluralize("inscrit", inscritsSansContrat)} sans contrat`}
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
          count={rupturants}
          label={pluralize("rupturant", rupturants)}
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
          count={abandons}
          label={pluralize("abandon", abandons)}
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
