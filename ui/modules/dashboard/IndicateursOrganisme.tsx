import {
  Box,
  Center,
  Flex,
  Grid,
  GridItem,
  HStack,
  ListItem,
  Skeleton,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { PlausibleGoalType, IOrganismesCount, TypeOrganismesIndicateurs, ORGANISME_INDICATEURS_TYPE } from "shared";

import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { formatNumber } from "@/common/utils/stringUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { usePlausibleTracking } from "@/hooks/plausible";
import { EffectifsFiltersFull } from "@/modules/models/effectifs-filters";

import { BlueBuilding, GreenCheck, RedFlashingLight } from "./icons";

interface CardProps {
  label: string;
  count: number;
  tooltipHeader?: ReactNode | string;
  tooltipLabel?: ReactNode | string;
  icon: ReactNode;
  big?: boolean;
  children?: ReactNode;
}

interface CardWithSubProps {
  label: string;
  count: number;
  tooltipHeader?: ReactNode | string;
  tooltipLabel?: ReactNode | string;
  icon: ReactNode;
  big?: boolean;
  children?: ReactNode;
  subCount: number;
  subLabel: string;
  subIcon: ReactNode;
  subTooltipHeader?: ReactNode | string;
  subTooltipLabel?: ReactNode | string;
}

function CardWithSubCard({
  label,
  count,
  tooltipHeader,
  tooltipLabel,
  icon,
  big = false,
  subCount,
  subLabel,
  subIcon,
  subTooltipHeader,
  subTooltipLabel,
}: CardWithSubProps) {
  return (
    <Center h="100%" justifyContent={big ? "center" : "start"} py="6" px="14">
      <VStack gap={3}>
        <Flex alignSelf={"start"}>
          <Box alignSelf={"center"} pt="3">
            {icon}
          </Box>
          <Text fontSize={big ? "40px" : "28px"} fontWeight="700">
            {formatNumber(count)}
          </Text>
        </Flex>
        <Box>
          <Text fontSize={"16px"} fontWeight="400" color="#3A3A3A">
            {label}
            {tooltipHeader && tooltipLabel ? (
              <InfoTooltip headerComponent={() => tooltipHeader} contentComponent={() => <Box>{tooltipLabel}</Box>} />
            ) : null}
          </Text>
        </Box>
        <Flex border="1px solid #DDDDDD" h="1px" w="100%"></Flex>
        <HStack>
          <Box>{subIcon}</Box>
          <Text fontSize={12} mx={1}>
            dont
          </Text>
          <Text fontSize={big ? "40px" : "28px"} fontWeight="700">
            {formatNumber(subCount)}
          </Text>
          <Text fontSize={"16px"} fontWeight="400" color="#3A3A3A">
            {subLabel}
            {subTooltipHeader && subTooltipLabel ? (
              <InfoTooltip
                headerComponent={() => subTooltipHeader}
                contentComponent={() => <Box>{subTooltipLabel}</Box>}
              />
            ) : null}
          </Text>
        </HStack>
      </VStack>
    </Center>
  );
}

function Card({ label, count, tooltipHeader, tooltipLabel, icon, big = false, children }: CardProps) {
  return (
    <Center h="100%" justifyContent={big ? "center" : "start"} py="6" px="10">
      <HStack gap={3}>
        <Box alignSelf={"center"} pt="3">
          {icon}
        </Box>
        <Box>
          <Flex>
            <Center>
              <Text fontSize={12} mx={1}>
                dont
              </Text>
              <Text fontSize={big ? "40px" : "28px"} fontWeight="700">
                {formatNumber(count)}
              </Text>
            </Center>
          </Flex>

          <Text fontSize={"16px"} fontWeight="400" color="#3A3A3A">
            {label}
            {tooltipHeader && tooltipLabel ? (
              <InfoTooltip headerComponent={() => tooltipHeader} contentComponent={() => <Box>{tooltipLabel}</Box>} />
            ) : null}
          </Text>
          {children}
        </Box>
      </HStack>
    </Center>
  );
}

const typeToGoalPlausible: { [key: string]: PlausibleGoalType } = {
  [ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS]: "telechargement_liste_organismes_sans_effectifs",
  [ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE]: "telechargement_liste_organismes_nature_inconnue",
  [ORGANISME_INDICATEURS_TYPE.SIRET_FERME]: "telechargement_liste_organismes_siret_ferme",
  [ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE]: "telechargement_liste_organismes_uai_non_determine",
};

interface IndicateursGridPropsLoading {
  loading: true;
}

interface IndicateursGridPropsReady {
  loading: false;
  effectifsFilters?: EffectifsFiltersFull;
  organismeId?: string;
  organismesCount?: IOrganismesCount;
}

type IndicateursGridProps = IndicateursGridPropsReady | IndicateursGridPropsLoading;

function IndicateursOrganisme(props: IndicateursGridProps) {
  const { trackPlausibleEvent } = usePlausibleTracking();

  const getIcon = (count?: number) => {
    return count ? <RedFlashingLight /> : <GreenCheck />;
  };

  const downloadOrganismesIndicateurs = async (type: TypeOrganismesIndicateurs) => {
    trackPlausibleEvent(typeToGoalPlausible[type]);
    const organismes = await _get(`/api/v1/organismes/${organismeId}/indicateurs/organismes/${type}`);
    exportDataAsXlsx(
      `tdb-organismes-${type}.xlsx`,
      organismes.map((organisme) => convertOrganismeToExport(organisme)),
      organismesExportColumns
    );
  };

  if (props.loading) {
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

  const { organismeId } = props;

  return (
    <Grid minH="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
      <GridItem bg="galt" colSpan={2} rowSpan={2}>
        <CardWithSubCard
          label="organismes de formation en apprentissage"
          count={props.organismesCount?.organismes ?? 0}
          icon={<BlueBuilding />}
          big={true}
          subLabel="organismes fiables"
          subCount={props.organismesCount?.fiables ?? 0}
          subIcon={<GreenCheck />}
          subTooltipHeader="Organisme fiable"
          subTooltipLabel={
            <>
              <Text>Est considéré comme fiable un organisme (OFA) :</Text>
              <UnorderedList mt={6} mb={6}>
                <ListItem>qui correspond à un couple UAI-SIRET validé dans le Référentiel UAI-SIRET (ONISEP).</ListItem>
                <ListItem>
                  dont l’état administratif du SIRET de l&apos;établissement, tel qu&apos;il est renseigné sur l’INSEE,
                  est ouvert
                </ListItem>
              </UnorderedList>
            </>
          }
        ></CardWithSubCard>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="sans effectifs transmis (ou arrêt)"
          count={props.organismesCount?.sansTransmissions ?? 0}
          icon={getIcon(props.organismesCount?.sansTransmissions)}
        >
          <DownloadButton
            variant="link"
            borderBottom={0}
            action={() => {
              downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS as "sans_effectifs");
            }}
          >
            Télécharger la liste
          </DownloadButton>
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="avec une nature “inconnue”"
          count={props.organismesCount?.natureInconnue ?? 0}
          tooltipHeader="Nature de l’organisme de formation"
          tooltipLabel={
            <>
              <Text>
                La donnée « Nature » est déduite des relations entre les organismes (base des Carif-Oref). Le Catalogue
                des formations en apprentissage identifie trois natures :
              </Text>{" "}
              <UnorderedList mt={6} mb={6}>
                <ListItem>Les organismes responsables</ListItem>
                <ListItem>Les organismes responsables et formateur</ListItem>
                <ListItem>Les organismes formateurs</ListItem>
              </UnorderedList>
              <Text>
                Une nature “inconnue” signifie que l&apos;organisme n&apos;a pas déclaré (ou de manière incomplète) son
                offre de formation dans la base de son Carif-Oref : l&apos;organisme doit se référencer ses formations
                en apprentissage auprès du, Carif-Oref régional ou se rapprocher du service dédié aux formations.
              </Text>
            </>
          }
          icon={getIcon(props.organismesCount?.natureInconnue)}
        >
          <DownloadButton
            variant="link"
            borderBottom={0}
            action={async () => {
              downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE as "nature_inconnue");
            }}
          >
            Télécharger la liste
          </DownloadButton>
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="avec un Siret fermé"
          count={props.organismesCount?.siretFerme ?? 0}
          tooltipHeader="État du Siret de l’établissement"
          tooltipLabel={
            <>
              <Text>
                Cette information est tirée de la base INSEE. Indication de l’état administratif (ouvert ou fermé) du
                Siret de l’établissement, tel qu’il est renseigné sur l’INSEE. Un établissement est affiché
                &quot;Fermé&quot; suite à une cessation d&apos;activité ou un déménagement.
              </Text>
              <Text>
                En cas de déménagement, une demande d’un nouveau Siret (via le Guichet Unique) doit être réalisée et ce
                dernier doit être communiqué aux différents acteurs publics.
              </Text>
              <Text>En savoir plus sur les démarches à suivre sur la page de Référencement.</Text>
            </>
          }
          icon={getIcon(props.organismesCount?.siretFerme)}
        >
          <DownloadButton
            variant="link"
            borderBottom={0}
            action={async () => {
              downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.SIRET_FERME as "siret_ferme");
            }}
          >
            Télécharger la liste
          </DownloadButton>
        </Card>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <Card
          label="avec une UAI “non déterminée”"
          count={props.organismesCount?.uaiNonDeterminee ?? 0}
          tooltipHeader="UAI non déterminée"
          tooltipLabel={
            <UnorderedList mt={6} mb={6}>
              <ListItem>
                Si l&apos;Unité Administrative Immatriculée (UAI) est répertoriée comme « Non déterminée » alors que
                l&apos;organisme en possède une, veuillez la communiquer en écrivant à referentiel-uai-siret@onisep.fr
                avec la fiche UAI, afin qu&apos;elle soit mise à jour. L&apos;absence de ce numéro bloque
                l&apos;enregistrement des contrats d&apos;apprentissage. L&apos;UAI est recommandée pour être reconnu
                OFA
              </ListItem>
              <ListItem>
                Si l&apos;organisme ne possède pas encore d&apos;UAI, il doit s&apos;adresser aux services du rectorat
                de l&apos;académie où se situe le CFA. Plus d&apos;informations dans la page de Référencement.
              </ListItem>
            </UnorderedList>
          }
          icon={getIcon(props.organismesCount?.uaiNonDeterminee)}
        >
          <DownloadButton
            variant="link"
            borderBottom={0}
            action={async () => {
              downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE as "uai_non_determine");
            }}
          >
            Télécharger la liste
          </DownloadButton>
        </Card>
      </GridItem>
    </Grid>
  );
}

export default IndicateursOrganisme;
