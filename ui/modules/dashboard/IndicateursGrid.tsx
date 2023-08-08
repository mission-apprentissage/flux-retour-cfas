import { Box, Center, Grid, GridItem, HStack, Skeleton, Text, Tooltip } from "@chakra-ui/react";
import { ReactNode } from "react";

import { effectifsExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { formatNumber } from "@/common/utils/stringUtils";
import DownloadLinkButton from "@/components/buttons/DownloadLinkButton";
import { EffectifsFilters, convertEffectifsFiltersToQuery } from "@/modules/models/effectifs-filters";
import { IndicateursEffectifs } from "@/modules/models/indicateurs";

import { AbandonsIcon, ApprenantsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "./icons";

interface CardProps {
  label: string;
  count: number;
  tooltipLabel: ReactNode;
  icon: ReactNode;
  big?: boolean;
  children?: ReactNode;
}
function Card({ label, count, tooltipLabel, icon, big = false, children }: CardProps) {
  return (
    <Center h="100%" justifyContent={big ? "center" : "start"} py="6" px="10">
      <HStack gap={3}>
        <Box alignSelf={"start"} pt="3">
          {icon}
        </Box>
        <Box>
          <Text fontSize={big ? "40px" : "28px"} fontWeight="700">
            {formatNumber(count)}
          </Text>
          <Text fontSize={12} whiteSpace="nowrap">
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
          {children}
        </Box>
      </HStack>
    </Center>
  );
}

export const typesEffectifNominatif = [
  "apprenant",
  "apprenti",
  "inscritSansContrat",
  "rupturant",
  "abandon",
  "inconnu",
] as const;
export type TypeEffectifNominatif = (typeof typesEffectifNominatif)[number];

interface IndicateursGridProps {
  indicateursEffectifs: IndicateursEffectifs;
  loading: boolean;
  permissionEffectifsNominatifs?: boolean | Array<(typeof typesEffectifNominatif)[number]>;
  effectifsFilters?: EffectifsFilters;
  organismeId?: string;
}
function IndicateursGrid({
  indicateursEffectifs,
  loading,
  permissionEffectifsNominatifs = false,
  effectifsFilters,
  organismeId,
}: IndicateursGridProps) {
  if (loading) {
    return (
      <Grid minH="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
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

  async function downloadEffectifsNominatifs(
    type: (typeof typesEffectifNominatif)[number],
    effectifsFilters: EffectifsFilters
  ) {
    const effectifs = await _get(
      `/api/v1${organismeId ? `/organismes/${organismeId}` : ""}/indicateurs/effectifs/${type}`,
      {
        params: convertEffectifsFiltersToQuery(effectifsFilters),
      }
    );

    exportDataAsXlsx(
      `tdb-effectifs-${type}-${effectifsFilters.date.toISOString().substring(0, 10)}.xlsx`,
      effectifs,
      effectifsExportColumns
    );
  }

  return (
    <Grid minH="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
      <GridItem bg="galt" colSpan={2} rowSpan={2}>
        <Card
          label="apprenants"
          count={indicateursEffectifs.apprenants}
          tooltipLabel={
            <>
              <b>Nombre d’apprenants en contrat d’apprentissage</b>
              <br />
              Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation. Est
              considéré comme un apprenant, un jeune inscrit en formation dans un organisme de formation en
              apprentissage. Il peut être&nbsp;:
              <br />
              - en formation et en recherche d’une entreprise (pas de contrat de signé)
              <br />
              - apprenti en entreprise (son contrat est signé)
              <br />- apprenti en rupture de contrat d’apprentissage et à la recherche d’un nouvel employeur
            </>
          }
          icon={<ApprenantsIcon />}
          big={true}
        >
          {(permissionEffectifsNominatifs instanceof Array
            ? permissionEffectifsNominatifs.includes("apprenant")
            : permissionEffectifsNominatifs) &&
            effectifsFilters && (
              <DownloadLinkButton
                fontSize="sm"
                isDisabled={indicateursEffectifs.apprenants === 0}
                action={async () => downloadEffectifsNominatifs("apprenant", effectifsFilters)}
              >
                Télécharger la liste
              </DownloadLinkButton>
            )}
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="dont apprentis"
          count={indicateursEffectifs.apprentis}
          tooltipLabel={
            <div>
              <b>Apprenti</b>
              <br />
              Un apprenti est un jeune apprenant inscrit en centre de formation et ayant signé un contrat dans une
              entreprise qui le forme.
            </div>
          }
          icon={<ApprentisIcon />}
        >
          {(permissionEffectifsNominatifs instanceof Array
            ? permissionEffectifsNominatifs.includes("apprenti")
            : permissionEffectifsNominatifs) &&
            effectifsFilters && (
              <DownloadLinkButton
                fontSize="sm"
                isDisabled={indicateursEffectifs.apprentis === 0}
                action={async () => downloadEffectifsNominatifs("apprenti", effectifsFilters)}
              >
                Télécharger la liste
              </DownloadLinkButton>
            )}
        </Card>
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
              Néanmoins, il reste inscrit dans le centre de formation et dispose d’un délai de 6 mois pour retrouver une
              entreprise auprès de qui se former.
            </div>
          }
          icon={<RupturantsIcon />}
        >
          {(permissionEffectifsNominatifs instanceof Array
            ? permissionEffectifsNominatifs.includes("rupturant")
            : permissionEffectifsNominatifs) &&
            effectifsFilters && (
              <DownloadLinkButton
                fontSize="sm"
                isDisabled={indicateursEffectifs.rupturants === 0}
                action={async () => downloadEffectifsNominatifs("rupturant", effectifsFilters)}
              >
                Télécharger la liste
              </DownloadLinkButton>
            )}
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="dont jeunes sans contrat"
          count={indicateursEffectifs.inscritsSansContrat}
          tooltipLabel={
            <div>
              <b>Jeune sans contrat</b>
              <br />
              Un jeune sans contrat est un jeune inscrit qui débute sa formation sans contrat signé en entreprise. Le
              jeune dispose d’un délai de 3 mois pour trouver son entreprise et continuer sereinement sa formation.
            </div>
          }
          icon={<InscritsSansContratsIcon />}
        >
          {(permissionEffectifsNominatifs instanceof Array
            ? permissionEffectifsNominatifs.includes("inscritSansContrat")
            : permissionEffectifsNominatifs) &&
            effectifsFilters && (
              <DownloadLinkButton
                fontSize="sm"
                isDisabled={indicateursEffectifs.inscritsSansContrat === 0}
                action={async () => downloadEffectifsNominatifs("inscritSansContrat", effectifsFilters)}
              >
                Télécharger la liste
              </DownloadLinkButton>
            )}
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="sorties d’apprentissage"
          count={indicateursEffectifs.abandons}
          tooltipLabel={
            <div>
              <b>Sorties d’apprentissage (anciennement “abandons”)</b>
              <br />
              Il s’agit du nombre d’apprenants ou apprentis qui ont définitivement quitté le centre de formation à la
              date affichée. Cette indication est basée sur un statut transmis par les organismes de formation. Ces
              situations peuvent être consécutives à une rupture de contrat d’apprentissage avec départ du centre de
              formation, à un départ du centre de formation sans que l’apprenant n’ait jamais eu de contrat, à un départ
              du centre de formation pour intégrer une entreprise en CDI ou CDD plus rémunérateur.
            </div>
          }
          icon={<AbandonsIcon />}
        >
          {(permissionEffectifsNominatifs instanceof Array
            ? permissionEffectifsNominatifs.includes("abandon")
            : permissionEffectifsNominatifs) &&
            effectifsFilters && (
              <DownloadLinkButton
                fontSize="sm"
                isDisabled={indicateursEffectifs.abandons === 0}
                action={async () => downloadEffectifsNominatifs("abandon", effectifsFilters)}
              >
                Télécharger la liste
              </DownloadLinkButton>
            )}
        </Card>
      </GridItem>
    </Grid>
  );
}

export default IndicateursGrid;
