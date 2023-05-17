import { Box, Center, Grid, GridItem, HStack, Skeleton, Text, Tooltip } from "@chakra-ui/react";
import { ReactNode } from "react";

import { formatNumber } from "@/common/utils/stringUtils";
import { IndicateursEffectifs } from "@/modules/models/indicateurs";

import { AbandonsIcon, ApprenantsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "./icons";

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
  loading: boolean;
}
function IndicateursGrid({ indicateursEffectifs, loading }: IndicateursGridProps) {
  if (loading) {
    return (
      <Grid h="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
        <GridItem colSpan={2} rowSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
      </Grid>
    );
  }

  return (
    <Grid h="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
      <GridItem bg="galt" colSpan={2} rowSpan={2}>
        <Card
          label="apprenants"
          count={indicateursEffectifs.apprenants}
          tooltipLabel={
            <div>
              <b>Nombre d’apprenants en contrat d’apprentissage</b>
              <br />
              au dernier jour du mois (ou J-1 si mois en cours). Cet indicateur est basé sur la réception d’un statut
              transmis par les organismes de formation. Il est affiné par la prise en compte des dates de début de
              contrat saisies. Est considéré comme un apprenant, un jeune inscrit en formation dans un centre. Il peut
              être soit déjà inscrit en entreprise (avec signature de contrat) soit en recherche d’une entreprise).
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
              <b>Apprenti</b>
              <br />
              Un apprenti est un jeune apprenant inscrit dans le centre de formation, suivant la formation et accueilli
              dans une entreprise qui la forme.
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
              <b>Rupturant</b>
              <br />
              Un jeune est considéré en rupture lorsqu’il ne travaille plus dans l’entreprise qui l’accueillait.
              Néanmoins, il reste inscrit dans le centre de formation et est en recherche d’une nouvelle entreprise avec
              qui se former.
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
              <b>Jeune sans contrat</b>
              <br />
              Un jeune inscrit en formation dans un centre toujours en recherche d’une entreprise. Le délai est de 3
              mois pour commencer son alternance.
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
              <b>Sorties d’apprentissage</b>
              <br />
              Il s’agit du nombre d’apprenants ou apprentis qui ont définitivement quitté le centre de formation à la
              date affichée. Cette indication est basée sur un statut transmis par les organismes de formation. Ces
              situations peuvent être consécutives à une rupture de contrat d’apprentissage avec départ du centre de
              formation, à un départ du centre de formation sans que l’apprenant n’ait jamais eu de contrat, à un départ
              du centre de formation pour intégrer une entreprise en CDI ou CDD plus rémunérateur.
            </div>
          }
          icon={<AbandonsIcon />}
        />
      </GridItem>
    </Grid>
  );
}

export default IndicateursGrid;
