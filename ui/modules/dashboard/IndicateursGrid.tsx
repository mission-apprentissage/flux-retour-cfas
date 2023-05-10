import { Box, Center, Grid, GridItem, HStack, Text, Tooltip } from "@chakra-ui/react";
import { ReactNode } from "react";

import { formatNumber } from "@/common/utils/stringUtils";

import { AbandonsIcon, ApprenantsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "./icons";
import { IndicateursEffectifs } from "./indicateurs";

interface CardProps {
  label: string;
  count: number;
  tooltipLabel: ReactNode;
  icon: ReactNode;
  big?: boolean;
}
function Card({ label, count, tooltipLabel, icon, big = false }: CardProps) {
  return (
    <Center h="100%" justifyContent={big ? "center" : "start"} py="6" px="12">
      <HStack gap={3}>
        {icon}
        <Box>
          <Text fontSize={big ? "40px" : "28px"} fontWeight="700">
            {formatNumber(count)}
          </Text>
          <Text fontSize={12}>
            {label}
            <Tooltip
              background="bluefrance"
              color="white"
              label={<Box padding="1w">{tooltipLabel}</Box>}
              aria-label={tooltipLabel as any}
            >
              <Box
                as="i"
                className="ri-information-line"
                fontSize="epsilon"
                color="grey.500"
                marginLeft="1w"
                verticalAlign="middle"
              />
            </Tooltip>
          </Text>
        </Box>
      </HStack>
    </Center>
  );
}

interface IndicateursGridProps {
  indicateursEffectifs: IndicateursEffectifs;
}
function IndicateursGrid({ indicateursEffectifs }: IndicateursGridProps) {
  return (
    <Grid h="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
      <GridItem bg="galt" colSpan={2} rowSpan={2}>
        <Card
          label="apprenants"
          count={indicateursEffectifs.apprenants}
          tooltipLabel={
            <div>
              <b>Nombre d&apos;apprenants en contrat d&apos;apprentissage</b> au dernier jour du mois (ou J-1 si mois en
              cours). Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation. Il
              est affiné par la prise en compte des dates de début de contrat saisie.
            </div>
          }
          icon={<ApprenantsIcon />}
          big={true}
        />
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="dont apprentis"
          count={indicateursEffectifs.apprentis}
          tooltipLabel={
            <div>
              <b>Nombre d&apos;apprentis en contrat d&apos;apprentissage</b> au dernier jour du mois (ou J-1 si mois en
              cours). Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation. Il
              est affiné par la prise en compte des dates de début de contrat saisie.
            </div>
          }
          icon={<ApprentisIcon />}
        />
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="dont rupturants"
          count={indicateursEffectifs.rupturants}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants en recherche de contrat après une rupture</b> et toujours dans cette situation à la
              date affichée. Cet indicateur est déduit de plusieurs statuts transmis par les organismes de formation.
            </div>
          }
          icon={<RupturantsIcon />}
        />
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="dont jeunes sans contrat"
          count={indicateursEffectifs.inscritsSansContrat}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants ayant démarré une formation en apprentissage sans avoir jamais signé de contrat</b>{" "}
              et toujours dans cette situation au dernier jour du mois (ou J-1 si mois en cours). Cet indicateur est
              déduit de plusieurs statuts transmis par les organismes de formation. Il est affiné par la prise en compte
              des dates d’enregistrement des inscriptions et de l’absence de dates de début de contrat.
            </div>
          }
          icon={<InscritsSansContratsIcon />}
        />
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="dont sorties d’apprentissage"
          count={indicateursEffectifs.abandons}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants ou d’apprentis qui ont définitivement quitté le centre de formation</b> à la date
              affichée. Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation.
            </div>
          }
          icon={<AbandonsIcon />}
        />
      </GridItem>
    </Grid>
  );
}

export default IndicateursGrid;
